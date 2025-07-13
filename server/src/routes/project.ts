import express from "express";
import * as projectController from "../controller/projectController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

router.post("/create/:orgId", protectRoute, projectController.createProject);

router.get(
  "/:projectId/organization/:orgId",
  protectRoute,
  projectController.getProjectsByOrgId
);

router.put(
  "/update/:projectId/organization/:oraganizationId",
  protectRoute,
  projectController.updateProject
);

router.put(
  "/archive/:projectId/:organizationId",
  protectRoute,
  projectController.archiveProject
);

router.get("/:orgId", protectRoute, projectController.getAllProjects);

router.put(
  "/unarchive/:projectId/:organizationId",
  protectRoute,
  projectController.unarchiveProject
);

router.get(
  "/clients/:organizationId",
  protectRoute,
  projectController.getClientsByOrganizationId
);

export default router;
