import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleGetProduct, handleSubmitPayment, handleDownload, getProducts } from "./routes/products.js";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.get("/api/health", async (_req, res) => {
    const products = await getProducts();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      productsCount: products.length,
      env: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      isNetlify: !!process.env.NETLIFY
    });
  });

  app.get("/api/debug-files", async (_req, res) => {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const files = await fs.readdir(process.cwd());
      const apiFiles = await fs.readdir(path.join(process.cwd(), "api")).catch(() => []);
      res.json({
        cwd: process.cwd(),
        files,
        apiFiles,
        dirname: import.meta.dirname
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get(["/api/products", "/api/product"], async (_req, res) => {
    const products = await getProducts();
    res.json(products);
  });

  app.get(["/api/products/:id", "/api/product/:id"], handleGetProduct);

  app.post("/api/submit-payment", handleSubmitPayment);

  app.get("/api/download/:token", handleDownload);

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  return app;
}
