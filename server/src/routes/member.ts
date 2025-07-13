import express from "express";
import { protectRoute } from "../middleware/auth";
import * as memberController from "../controller/memberController";

const router = express.Router();

//send invite email
router.post(
  "/:organizationId/invite",
  protectRoute,
  memberController.inviteNewMember
);

//send reinvite email
router.post(
  "/:organizationId/invite/:memberId/reinvite",
  protectRoute,
  memberController.reinviteInactiveMember
);

//resend invitation email
router.post(
  "/:organizationId/invitations/:invitationId/resend",
  protectRoute,
  memberController.resendInvite
);

//accept invitation request
router.put(
  "/invitation/accept/:token",
  protectRoute,
  memberController.acceptInvitation
);

router.put(
  "/:organizationId/members/:memberId",
  protectRoute,
  memberController.updateMember
);

//transfer ownership
router.post(
  "/:organizationId/members/:memberId/transfer-ownership",
  protectRoute,
  memberController.transferOwnership
);


export default router;
