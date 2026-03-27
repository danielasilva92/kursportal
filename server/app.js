import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import scrapeRoutes from "./routes/scrapeRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", scrapeRoutes);

const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;