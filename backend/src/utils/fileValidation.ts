import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../constants/upload.constants";
import path from "path";

export function validateFile(mimeType: string, fileSize: number, fileName: string): { isValid: boolean; error?: string } {
  if (fileSize > MAX_FILE_SIZE) {
    return { isValid: false, error: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }

  // Check MIME Type
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mimeType);

  // Fallback to extension check for safety/robustness
  const ext = path.extname(fileName).toLowerCase();
  const allowedExtensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".mp4", ".webm", ".mov", ".avi",
    ".mp3", ".ogg", ".wav",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".csv", ".json",
    ".zip", ".tar", ".rar", ".gz"
  ];
  const isExtAllowed = allowedExtensions.includes(ext);

  if (!isMimeAllowed && !isExtAllowed) {
    return { isValid: false, error: "Unsupported file type or file extension." };
  }

  return { isValid: true };
}
