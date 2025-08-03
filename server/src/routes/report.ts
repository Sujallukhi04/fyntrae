import express from "express";
import * as reportController from "../controller/reportController";
import { protectRoute } from "../middleware/auth";
const router = express.Router();

router.post("/:organizationId", protectRoute, reportController.createReport);
router.get(
  "/:publicSecret",
  protectRoute,
  reportController.getPublicReportById
);

router.get(
  "/:organizationId/reports",
  protectRoute,
  reportController.getReports
);
export default router;
