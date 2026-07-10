import multer from "multer";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../constants/upload.constants";

export enum ResourceType {
  IMAGE = "IMAGE",
  PDF = "PDF",
  VIDEO = "VIDEO",
  OTHER = "OTHER",
}

const MIME_TYPE_MAP: Record<string, ResourceType> = {
  "image/jpeg": ResourceType.IMAGE,
  "image/png": ResourceType.IMAGE,
  "image/gif": ResourceType.IMAGE,
  "image/webp": ResourceType.IMAGE,
  "image/svg+xml": ResourceType.IMAGE,
  "application/pdf": ResourceType.PDF,
  "video/mp4": ResourceType.VIDEO,
  "video/webm": ResourceType.VIDEO,
  "video/quicktime": ResourceType.VIDEO,
};

export function getFileType(mimetype: string): ResourceType {
  return MIME_TYPE_MAP[mimetype] || ResourceType.OTHER;
}

const storage = multer.memoryStorage();

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Broaden file type acceptance, only reject completely unrecognized/malicious MIME types if needed
  // But let's allow all MIME types listed in ALLOWED_MIME_TYPES
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || file.mimetype.startsWith("application/octet-stream")) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export const upload = multerInstance.single("file");
export const uploadMultiple = multerInstance.array("files", 10);
