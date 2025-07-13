import express from "express";
import * as organizationController from "../controller/organization";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

//get cuurent organization by organizationId
router.get(
  "/:organizationId",
  protectRoute,
  organizationController.getCurrentOrganization
);

// Switch organization
router.post("/switch", protectRoute, organizationController.switchOrganization);

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

// Create new organization
router.post("/", protectRoute, organizationController.createOrganization);

// Get organization members
router.get(
  "/:organizationId/members",
  protectRoute,
  organizationController.getOrganizationMembers
);

//Get organization invitations
router.get(
  "/:organizationId/invitations",
  protectRoute,
  organizationController.getOrganizationInvitations
);

//deactivate member
router.patch(
  "/:organizationId/members/:memberId/deactivate",
  protectRoute,
  organizationController.deactiveMember
);

// Delete member from organization
router.delete(
  "/:organizationId/members/:memberId",
  protectRoute,
  organizationController.deleteMember
);

router.delete(
  "/:organizationId/invitations/:invitationId",
  protectRoute,
  organizationController.deleteInvitation
);


export default router;
