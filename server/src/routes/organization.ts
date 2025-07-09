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

//send invite email
router.post(
  "/:organizationId/invite",
  protectRoute,
  organizationController.inviteNewMember
);

//send reinvite email
router.post(
  "/:organizationId/invite/:memberId/reinvite",
  protectRoute,
  organizationController.reinviteInactiveMember
);

//resend invitation email
router.post(
  "/:organizationId/invitations/:invitationId/resend",
  protectRoute,
  organizationController.resendInvite
);

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

//accept invitation request
router.put(
  "/invitation/accept/:token",
  protectRoute,
  organizationController.acceptInvitation
);

router.put(
  "/:organizationId/members/:memberId",
  protectRoute,
  organizationController.updateMember
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

// Update member role
// router.patch("/:organizationId/members/role", protectRoute, organizationController.updateMemberRole);

// Deactivate member (convert to placeholder)
// router.patch("/:organizationId/members/:memberId/deactivate", protectRoute, organizationController.deactivateMember);

// Reactivate placeholder user
// router.post("/:organizationId/members/:memberId/reactivate", protectRoute, organizationController.reactivatePlaceholder);

export default router;
