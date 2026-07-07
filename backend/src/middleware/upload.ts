import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

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

const SUB_DIRS: Record<ResourceType, string> = {
  [ResourceType.IMAGE]: 'images',
  [ResourceType.PDF]: 'pdfs',
  [ResourceType.VIDEO]: 'videos',
  [ResourceType.OTHER]: 'other',
};

export function getFileType(mimetype: string): ResourceType {
  return MIME_TYPE_MAP[mimetype] || ResourceType.OTHER;
}

const ALLOWED_MIME_TYPES = Object.keys(MIME_TYPE_MAP);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = getFileType(file.mimetype);
    const subDir = SUB_DIRS[fileType];
    const uploadPath = path.join('uploads', subDir);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

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
