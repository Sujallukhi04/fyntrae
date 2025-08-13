import express from "express";
import * as timeSummaryController from "./controller";
import { protectRoute } from "../../middleware/auth";

const router = express.Router();

router.get(
  "/:organizationId",
  protectRoute,
  timeSummaryController.getTimeSummaryGrouped
);

router.get(
  "/export/:organizationId",
  protectRoute,
  timeSummaryController.exportTimeSummary
);

router.get("/detailed/export/:organizationId", protectRoute, timeSummaryController.exportDetailedTimeSummary);

router.get("/dashboard/:organizationId", protectRoute, timeSummaryController.getDashboardTimeSummary);

export default router;
