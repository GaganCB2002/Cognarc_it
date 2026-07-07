import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";
import {
  uploadFile,
  getFile,
  deleteFile,
  getMyFiles,
  updateFileMetadata,
} from "../controllers/uploadController";

const router = Router();

// Document listing and management
router.get("/my-files", authenticate, getMyFiles);

// File CRUD
router.post("/", authenticate, upload, uploadFile);
router.get("/:id", authenticate, getFile);
router.patch("/:id/metadata", authenticate, updateFileMetadata);
router.delete("/:id", authenticate, deleteFile);

export default router;
