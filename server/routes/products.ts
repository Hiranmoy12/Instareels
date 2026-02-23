import { RequestHandler } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { Product, ProductDetail, PaymentResponse } from "../../shared/api.js";

const __dirname = import.meta.dirname;
const isServerless = process.env.VERCEL || process.env.NETLIFY;
const PRODUCTS_FILE = path.resolve(process.cwd(), "products.json");
const UPLOADS_DIR = isServerless ? "/tmp" : path.resolve(process.cwd(), "uploads");
const PRIVATE_PRODUCTS_DIR = path.resolve(process.cwd(), "private-products");

// In-memory token store (Token -> { productId, expiry })
const downloadTokens = new Map<string, { productId: string; expiry: number }>();

// Multer setup for screenshot uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /image\/(jpeg|png|jpg|gif)/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

export const getProducts = async (): Promise<any[]> => {
  const possiblePaths = [
    PRODUCTS_FILE,
    path.resolve(process.cwd(), "products.json"),
    path.resolve(__dirname, "../../products.json"),
    path.resolve(__dirname, "../../../products.json"),
    "/var/task/products.json",
    path.join(process.cwd(), "api", "products.json"),
  ];

  console.log(`[getProducts] process.cwd(): ${process.cwd()}`);
  console.log(`[getProducts] __dirname: ${__dirname}`);

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      const data = await fs.readFile(p, "utf-8");
      const products = JSON.parse(data);
      console.log(`[getProducts] Successfully loaded products from: ${p}`);
      return products;
    } catch (e) {
      // Continue to next path
    }
  }

  console.error("Could not find products.json in any of these locations:", possiblePaths);
  return [];
};

export const handleGetProduct: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const products = await getProducts();
  const product = products.find((p) => p.id === id);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Return product detail with fampayId from env
  const productDetail: ProductDetail = {
    id: product.id,
    title: product.title,
    price: product.price,
    qrImage: product.qrImage,
    fampayId: process.env.FAMPAY_ID || "8967888613@fam",
  };

  res.json(productDetail);
};

export const handleSubmitPayment: RequestHandler = (req: any, res) => {
  // Use multer as a manual middleware for this route if needed
  upload.single("screenshot")(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }

    const { productId, name, transactionId } = req.body;
    
    if (!productId || !name || !transactionId || !req.file) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    // Mock verification: Always succeeds in this demo
    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    downloadTokens.set(token, { productId, expiry });

    const response: PaymentResponse = {
      success: true,
      message: "Payment submitted and verified! Your download link is ready.",
      downloadToken: token,
    };

    res.json(response);
  });
};

export const handleDownload: RequestHandler = async (req, res) => {
  const { token } = req.params;
  const tokenData = downloadTokens.get(token);

  if (!tokenData) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  if (Date.now() > tokenData.expiry) {
    downloadTokens.delete(token);
    res.status(403).json({ error: "Token has expired" });
    return;
  }

  const products = await getProducts();
  const product = products.find((p) => p.id === tokenData.productId);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const possibleFilePaths = [
    path.join(process.cwd(), product.filePath),
    path.resolve(__dirname, "../../", product.filePath),
    path.resolve(__dirname, "../../../", product.filePath),
    path.join("/var/task", product.filePath),
  ];

  let filePath = null;
  for (const p of possibleFilePaths) {
    try {
      await fs.access(p);
      filePath = p;
      console.log(`[handleDownload] Found file at: ${p}`);
      break;
    } catch (e) {
      // Continue
    }
  }

  if (!filePath) {
    console.error("File not found in any of these locations:", possibleFilePaths);
    res.status(500).json({ error: "Product file is missing or inaccessible" });
    return;
  }

  try {
    res.download(filePath);
    // Optional: Delete token after download? For security, yes.
    downloadTokens.delete(token);
  } catch (error) {
    console.error("File download error:", error);
    res.status(500).json({ error: "Error during file transmission" });
  }
};
