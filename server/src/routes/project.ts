import express from "express";
import * as projectController from "../controller/projectController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

// ─────────────────────────────
// PROJECT ROUTES
// ─────────────────────────────

router.post("/create/:orgId", protectRoute, projectController.createProject);

router.get("/:orgId", protectRoute, projectController.getAllProjects);

router.get(
  "/:projectId/organization/:orgId",
  protectRoute,
  projectController.getProjectsByOrgId
);

router.put(
  "/update/:projectId/organization/:organizationId",
  protectRoute,
  projectController.updateProject
);

router.put(
  "/archive/:projectId/:organizationId",
  protectRoute,
  projectController.archiveProject
);

router.put(
  "/unarchive/:projectId/:organizationId",
  protectRoute,
  projectController.unarchiveProject
);

// ─────────────────────────────
// CLIENTS
// ─────────────────────────────

router.get(
  "/clients/:organizationId",
  protectRoute,
  projectController.getClientsByOrganizationId
);

// ─────────────────────────────
// ORGANIZATION MEMBERS (generic org members)
// ─────────────────────────────

router.get(
  "/org-members/:organizationId",
  protectRoute,
  projectController.getMembersByOrganizationId
);

// ─────────────────────────────
// PROJECT MEMBERS
// ─────────────────────────────

router.get(
  "/project-members/:projectId/:organizationId",
  protectRoute,
  projectController.getProjectMembers
);

router.post(
  "/project-members/:projectId/:organizationId",
  protectRoute,
  projectController.addProjectMember
);

router.put(
  "/project-members/:projectId/:organizationId/:memberId",
  protectRoute,
  projectController.updateProjectMember
);

router.delete(
  "/project-members/:projectId/:organizationId/:memberId",
  protectRoute,
  projectController.removeProjectMember
);

export default router;
