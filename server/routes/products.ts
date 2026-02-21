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
  try {
    let data;
    try {
      data = await fs.readFile(PRODUCTS_FILE, "utf-8");
    } catch (e) {
      // Fallback for different serverless layouts
      const fallbackPath = path.resolve(__dirname, "../../products.json");
      data = await fs.readFile(fallbackPath, "utf-8");
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading products file:", error);
    return [];
  }
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
    fampayId: process.env.FAMPAY_ID || "yourname@fam",
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

  const filePath = path.join(process.cwd(), product.filePath);
  
  try {
    await fs.access(filePath);
    res.download(filePath);
    // Optional: Delete token after download? For security, yes.
    downloadTokens.delete(token);
  } catch (error) {
    console.error("File access error:", error);
    res.status(500).json({ error: "Product file is missing or inaccessible" });
  }
};
