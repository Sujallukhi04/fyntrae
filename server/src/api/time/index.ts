import express from "express";
import * as timeController from "./controller";
import { protectRoute } from "../../middleware/auth";

const router = express.Router();

// ─────────────────────────────
// TIMER ROUTES
// ─────────────────────────────

// Get running timer
router.get(
  "/:organizationId/timer/running",
  protectRoute,
  timeController.getRunningTimer
);

// Start timer
router.post(
  "/:organizationId/timer/start",
  protectRoute,
  timeController.startTimer
);

// Stop timer
router.patch(
  "/:organizationId/timer/:timeEntryId/stop",
  protectRoute,
  timeController.stopTimer
);

// ─────────────────────────────
// TIME ENTRY ROUTES
// ─────────────────────────────

// Get time entries with filtering and pagination
router.get("/:organizationId", protectRoute, timeController.getTimeEntries);

// Create time entry
router.post("/:organizationId", protectRoute, timeController.createTimeEntry);

// Update time entry
router.put(
  "/:organizationId/:timeEntryId",
  protectRoute,
  timeController.updateTimeEntry
);

// Delete time entry
router.delete(
  "/:organizationId/:timeEntryId",
  protectRoute,
  timeController.deleteTimeEntry
);

// Bulk update time entries
router.put(
  "/:organizationId/bulk/update",
  protectRoute,
  timeController.bulkUpdateTimeEntries
);

// Bulk delete time entries
router.delete(
  "/:organizationId/bulk/delete",
  protectRoute,
  timeController.bulkDeleteTimeEntries
);

router.get(
  "/:organizationId/projects-with-tasks",
  protectRoute,
  timeController.getAllProjectWithTasks
);

export default router;
