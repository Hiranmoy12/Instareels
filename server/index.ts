import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleGetProduct, handleSubmitPayment, handleDownload, getProducts } from "./routes/products";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.get("/api/products", async (_req, res) => {
    const products = await getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", handleGetProduct);

  app.post("/api/submit-payment", handleSubmitPayment);

  app.get("/api/download/:token", handleDownload);

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  return app;
}
