import express from "express";
import * as clientController from "../controller/clientController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

// Create a new client
router.post(
  "/create/:organizationId",
  protectRoute,
  clientController.createClient
);

// Get all clients for an organization
router.get("/:organizationId", protectRoute, clientController.getClients);

// update a client
router.put(
  "/:clientId/organzation/:organizationId",
  protectRoute,
  clientController.editClient
);

//archive a client
router.put("/:clientId/archive", protectRoute, clientController.archiveClient);

//unarchive a client
router.put(
  "/:clientId/unarchive",
  protectRoute,
  clientController.unArchiveClient
);

export default router;
