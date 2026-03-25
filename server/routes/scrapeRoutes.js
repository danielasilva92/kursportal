import express from "express";
import {
  scrapeUrl,
  findCreators,
  discoverCreators,
  exportCsv,
   runPipeline,
} from "../controllers/ScrapeController.js";

const router = express.Router();

router.post("/scrape", scrapeUrl);
router.post("/find-creators", findCreators);
router.get("/discover-creators", discoverCreators);
router.post("/export-csv", exportCsv);
router.get("/run-pipeline", runPipeline);

export default router;