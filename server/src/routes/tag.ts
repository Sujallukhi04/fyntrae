import express from "express";
import * as tagController from "../controller/tagController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

// Route to create a new tag
router.post("/:organizationId", protectRoute, tagController.createTag);

// Route to get all tags
router.get("/:organizationId", protectRoute, tagController.getAllTags);

router.delete("/:organizationId/:tagId", protectRoute, tagController.deleteTag);

export default router;
