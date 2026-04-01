import express from "express";
import rateLimit from "express-rate-limit";
import {
  scrapeUrl,
  findCreators,
  discoverCreators,
  exportCsv,
  runPipeline,
  analyzeCreator,
  runDeepScan,
} from "../controllers/scrapeController.js";

const router = express.Router();

// Generell begränsning: max 60 req/minut per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "För många förfrågningar, försök igen om en minut." },
});

// Tung begränsning för dyra endpoints (pipeline, deep-scan, AI-analys)
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "För många tunga förfrågningar, försök igen om en minut." },
});

router.use(generalLimiter);

router.post("/scrape", scrapeUrl);
router.post("/find-creators", findCreators);
router.get("/discover-creators", discoverCreators);
router.post("/export-csv", exportCsv);
router.get("/run-pipeline", heavyLimiter, runPipeline);
router.post("/analyze-creator", heavyLimiter, analyzeCreator);
router.get("/deep-scan", heavyLimiter, runDeepScan);

export default router;