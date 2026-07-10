export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  // Audio
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/json",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-tar",
  "application/x-rar-compressed",
  "application/gzip",
];

export const ERROR_MESSAGES = {
  FILE_MISSING: "No file provided.",
  FILE_TOO_LARGE: "File size exceeds the 100MB limit.",
  INVALID_TYPE: "Unsupported file type or extension.",
  UNAUTHORIZED: "You must be authenticated to perform this operation.",
  FORBIDDEN: "You do not have permission to access this resource.",
  DRIVE_UNAVAILABLE: "Google Drive storage service is currently unavailable.",
  DRIVE_CREDS_ERROR: "Google Drive authentication failed due to invalid credentials.",
};
