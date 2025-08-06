import express from "express";
import * as reportController from "./controller";
import { protectRoute } from "../../middleware/auth";
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

router.put(
  "/:organizationId/:reportId",
  protectRoute,
  reportController.updateReport
);

router.delete(
  "/:organizationId/:reportId",
  protectRoute,
  reportController.deleteReport
);
export default router;
