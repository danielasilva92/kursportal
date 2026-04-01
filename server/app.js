import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import scrapeRoutes from "./routes/scrapeRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();

// Behövs för att rate limiting ska fungera bakom Renders proxy
app.set("trust proxy", 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} inte tillåten`));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", scrapeRoutes);

const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;