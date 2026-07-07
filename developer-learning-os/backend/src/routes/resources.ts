import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "../controllers/resourceController";

const router = Router();

router.get("/", authenticate, getResources);
router.get("/:id", authenticate, getResourceById);
router.post("/", authenticate, createResource);
router.put("/:id", authenticate, updateResource);
router.delete("/:id", authenticate, deleteResource);

export default router;
