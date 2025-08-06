import express from "express";
import { protectRoute } from "../../middleware/auth";
import * as memberController from "./controller";

const router = express.Router();

// ─────────────────────────────
// INVITATION MANAGEMENT
// ─────────────────────────────

// Invite a new member
router.post(
  "/:organizationId/invite",
  protectRoute,
  memberController.inviteNewMember
);

// Reinvite an inactive member
router.post(
  "/:organizationId/members/:memberId/reinvite",
  protectRoute,
  memberController.reinviteInactiveMember
);

// Resend an invitation (pending)
router.post(
  "/:organizationId/invitations/:invitationId/resend",
  protectRoute,
  memberController.resendInvite
);

// Accept invitation via token
router.put(
  "/invitation/accept/:token",
  protectRoute,
  memberController.acceptInvitation
);

// ─────────────────────────────
// MEMBER MANAGEMENT
// ─────────────────────────────

// Update member (role, billable rate, etc.)
router.put(
  "/:organizationId/members/:memberId",
  protectRoute,
  memberController.updateMember
);

// Transfer ownership
router.post(
  "/:organizationId/members/:memberId/transfer-ownership",
  protectRoute,
  memberController.transferOwnership
);

export default router;
