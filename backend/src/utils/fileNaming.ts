import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Sanitizes a filename by removing unsafe characters
 */
export function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  
  // Keep alphanumeric, dash, underscore, space, and replace everything else
  const cleanBase = base.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim();
  
  // Make sure we have a valid name, fallback if empty
  const safeBase = cleanBase || "file";
  
  // Keep only secure extensions
  const cleanExt = ext.replace(/[^a-zA-Z0-9\.]/g, "");
  
  return `${safeBase}${cleanExt}`;
}

/**
 * Generates a unique filename in the format: uuid_timestamp_sanitizedName.ext
 */
export function generateUniqueFilename(userId: string, originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  const timestamp = Date.now();
  const uuidPart = uuidv4().substring(0, 8);
  
  // format: userId_timestamp_uuid_sanitizedName
  const cleanUserId = userId.replace(/[^a-zA-Z0-9_\-]/g, "");
  return `${cleanUserId}_${timestamp}_${uuidPart}_${sanitized}`;
}
