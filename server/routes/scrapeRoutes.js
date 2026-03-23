import express from "express";
import {
  scrapeUrl,
  findCreators,
  discoverCreators,
  exportCsv,
} from "../controllers/scrapeController.js";

const router = express.Router();

router.post("/scrape", scrapeUrl);
router.post("/find-creators", findCreators);
router.get("/discover-creators", discoverCreators);
router.post("/export-csv", exportCsv);

export default router;