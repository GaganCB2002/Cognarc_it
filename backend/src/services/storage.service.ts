import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type StorageProvider = "LOCAL" | "S3";

interface StorageConfig {
  provider: StorageProvider;
  localBasePath: string;
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  publicBaseUrl?: string;
}

interface StoredFile {
  storageKey: string;
  provider: StorageProvider;
  publicUrl: string | null;
  size: number;
}

const config: StorageConfig = {
  provider: (process.env.STORAGE_PROVIDER as StorageProvider) || "LOCAL",
  localBasePath: process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "uploads"),
  s3Bucket: process.env.S3_BUCKET,
  s3Region: process.env.S3_REGION,
  s3AccessKey: process.env.S3_ACCESS_KEY,
  s3SecretKey: process.env.S3_SECRET_KEY,
  publicBaseUrl: process.env.STORAGE_PUBLIC_URL || "",
};

function getUserFolder(userId: string): string {
  // Organize by user: uploads/users/{userId}/{type}/
  // The userId is partitioned to avoid too many files in one directory
  const partition = userId.substring(0, 2);
  return path.join("users", partition, userId);
}

function getMimeSubDir(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "images";
  if (mimeType === "application/pdf") return "pdfs";
  if (mimeType.startsWith("video/")) return "videos";
  return "other";
}

export function generateStorageKey(userId: string, mimeType: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueName = `${uuidv4()}${ext}`;
  const subDir = getMimeSubDir(mimeType);
  return path.join(getUserFolder(userId), subDir, uniqueName).replace(/\\/g, "/");
}

async function saveToLocal(storageKey: string, buffer: Buffer): Promise<void> {
  const fullPath = path.join(config.localBasePath, storageKey);
  const dir = path.dirname(fullPath);

  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }

  await fs.writeFile(fullPath, buffer);
}

async function readFromLocal(storageKey: string): Promise<Buffer> {
  const fullPath = path.join(config.localBasePath, storageKey);
  return fs.readFile(fullPath);
}

async function deleteFromLocal(storageKey: string): Promise<void> {
  const fullPath = path.join(config.localBasePath, storageKey);
  await fs.unlink(fullPath).catch(() => {});
}

async function existsOnLocal(storageKey: string): Promise<boolean> {
  const fullPath = path.join(config.localBasePath, storageKey);
  return fsSync.existsSync(fullPath);
}

async function saveToS3(storageKey: string, buffer: Buffer): Promise<void> {
  // S3 integration placeholder - implement with @aws-sdk/client-s3
  // const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  // const client = new S3Client({ region: config.s3Region, credentials: { ... } });
  // await client.send(new PutObjectCommand({ Bucket: config.s3Bucket, Key: storageKey, Body: buffer }));
  throw new Error("S3 storage not configured. Set STORAGE_PROVIDER=LOCAL or configure S3 credentials.");
}

export async function saveFile(
  userId: string,
  mimeType: string,
  originalName: string,
  buffer: Buffer
): Promise<StoredFile> {
  const storageKey = generateStorageKey(userId, mimeType, originalName);

  if (config.provider === "S3") {
    await saveToS3(storageKey, buffer);
  } else {
    await saveToLocal(storageKey, buffer);
  }

  const publicUrl = config.provider === "S3" && config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/$/, "")}/${storageKey}`
    : null;

  return {
    storageKey,
    provider: config.provider,
    publicUrl,
    size: buffer.length,
  };
}

export async function getFile(storageKey: string): Promise<Buffer | null> {
  try {
    if (config.provider === "S3") {
      throw new Error("S3 read not implemented");
    }
    return await readFromLocal(storageKey);
  } catch {
    return null;
  }
}

export async function deleteFile(storageKey: string): Promise<void> {
  if (config.provider === "S3") {
    // S3 delete placeholder
  } else {
    await deleteFromLocal(storageKey);
  }
}

export async function fileExists(storageKey: string): Promise<boolean> {
  if (config.provider === "S3") {
    return false;
  }
  return existsOnLocal(storageKey);
}

export function getLocalPath(storageKey: string): string {
  return path.join(config.localBasePath, storageKey);
}
