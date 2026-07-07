import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { generateStorageKey } from '../services/storage.service';

export enum ResourceType {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
}

const MIME_TYPE_MAP: Record<string, ResourceType> = {
  'image/jpeg': ResourceType.IMAGE,
  'image/png': ResourceType.IMAGE,
  'image/gif': ResourceType.IMAGE,
  'image/webp': ResourceType.IMAGE,
  'application/pdf': ResourceType.PDF,
  'video/mp4': ResourceType.VIDEO,
  'video/webm': ResourceType.VIDEO,
  'video/quicktime': ResourceType.VIDEO,
};

export function getFileType(mimetype: string): ResourceType {
  return MIME_TYPE_MAP[mimetype] || ResourceType.OTHER;
}

const ALLOWED_MIME_TYPES = Object.keys(MIME_TYPE_MAP);

const storage = multer.memoryStorage();

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
}).single('file');
