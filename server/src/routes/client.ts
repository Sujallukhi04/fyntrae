import express from "express";
import * as clientController from "../controller/clientController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

// ─────────────────────────────
// CLIENT ROUTES
// ─────────────────────────────

// Create a new client in an organization
router.post(
  "/create/:organizationId",
  protectRoute,
  clientController.createClient
);

// Get all clients for an organization
router.get("/:organizationId", protectRoute, clientController.getClients);

// Update a client
router.put(
  "/:clientId/organization/:organizationId",
  protectRoute,
  clientController.editClient
);

// Archive a client
router.put("/:clientId/archive", protectRoute, clientController.archiveClient);

// Unarchive a client
router.put(
  "/:clientId/unarchive",
  protectRoute,
  clientController.unArchiveClient
);

// Delete a client
router.delete(
  "/:clientId/organization/:organizationId",
  protectRoute,
  clientController.deleteClient
);

export default router;
