import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";
import {
  uploadFile,
  getFile,
  deleteFile,
} from "../controllers/uploadController";

const router = Router();

router.post("/", authenticate, upload, uploadFile);
router.get("/:id", authenticate, getFile);
router.delete("/:id", authenticate, deleteFile);

export default router;
