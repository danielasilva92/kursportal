import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import scrapeRoutes from "./routes/scrapeRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running " });
});

app.use("/api", scrapeRoutes);

export default app;