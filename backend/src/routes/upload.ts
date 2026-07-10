import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { upload, uploadMultiple } from "../middleware/upload";
import {
  uploadFile,
  uploadMultipleFiles,
  getFile,
  downloadFile,
  previewFile,
  replaceFile,
  renameFile,
  deleteFile,
  getMyFiles,
  updateFileMetadata,
  extractText,
} from "../controllers/uploadController";

const router = Router();

// Document listing and management
router.get("/my-files", authenticate, getMyFiles);

// File CRUD
router.post("/", authenticate, upload, uploadFile);
router.post("/multiple", authenticate, uploadMultiple, uploadMultipleFiles);
router.post("/:id/replace", authenticate, upload, replaceFile);
router.patch("/:id/rename", authenticate, renameFile);
router.get("/:id/download", authenticate, downloadFile);
router.get("/:id/preview", authenticate, previewFile);
router.get("/:id", authenticate, getFile);
router.get("/:id/text", authenticate, extractText);
router.patch("/:id/metadata", authenticate, updateFileMetadata);
router.delete("/:id", authenticate, deleteFile);

export default router;
