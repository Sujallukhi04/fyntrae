import express from "express";
import * as timeSummaryController from "../controller/timesummaryController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

router.get(
  "/:organizationId",
  protectRoute,
  timeSummaryController.getTimeSummary
);

router.get(
  "/:organizationId/time-summary-grouped",
  protectRoute,
  timeSummaryController.getTimeSummaryGrouped
);

export default router;
