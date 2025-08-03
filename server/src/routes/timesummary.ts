import express from "express";
import * as timeSummaryController from "../controller/timesummaryController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

router.get(
  "/:organizationId",
  protectRoute,
  timeSummaryController.getTimeSummaryGrouped
);

router.get(
  "/:organizationId/export",
  protectRoute,
  timeSummaryController.exportTimeSummary
);

export default router;
