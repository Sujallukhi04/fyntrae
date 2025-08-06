import express from "express";
import * as organizationController from "./controller";
import { protectRoute } from "../../middleware/auth";

const router = express.Router();

// ─────────────────────────────
// ORGANIZATION CRUD
// ─────────────────────────────

// Create a new organization
router.post("/", protectRoute, organizationController.createOrganization);

// Get current organization by ID
router.get(
  "/:organizationId",
  protectRoute,
  organizationController.getCurrentOrganization
);

// Update organization
router.put(
  "/:organizationId",
  protectRoute,
  organizationController.updateOrganization
);

// Delete organization
router.delete(
  "/:organizationId",
  protectRoute,
  organizationController.deleteOrganization
);

// Switch organization
router.post("/switch", protectRoute, organizationController.switchOrganization);

// ─────────────────────────────
// ORGANIZATION MEMBERS
// ─────────────────────────────

// Get members (supports pagination or all via query)
router.get(
  "/:organizationId/members",
  protectRoute,
  organizationController.getOrganizationMembers
);

// Deactivate member
router.patch(
  "/:organizationId/members/:memberId/deactivate",
  protectRoute,
  organizationController.deactiveMember
);

// Delete member
router.delete(
  "/:organizationId/members/:memberId",
  protectRoute,
  organizationController.deleteMember
);

// ─────────────────────────────
// INVITATIONS
// ─────────────────────────────

// Get all invitations
router.get(
  "/:organizationId/invitations",
  protectRoute,
  organizationController.getOrganizationInvitations
);

// Delete invitation
router.delete(
  "/:organizationId/invitations/:invitationId",
  protectRoute,
  organizationController.deleteInvitation
);

export default router;
