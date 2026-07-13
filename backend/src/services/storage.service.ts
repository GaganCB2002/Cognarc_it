import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as githubStorage from "./githubStorage.service";
import * as googleDriveStorage from "./googleDrive.service";
import { supabaseAdmin } from "../lib/supabase";

export type StorageProvider = "LOCAL" | "S3" | "GITHUB" | "GOOGLE_DRIVE" | "SUPABASE";

interface StorageConfig {
  provider: StorageProvider;
  localBasePath: string;
  supabaseBucket: string;
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  publicBaseUrl?: string;
}

export interface StoredFile {
  storageKey: string;
  provider: StorageProvider;
  publicUrl: string | null;
  size: number;
  metadata?: any;
}

const config: StorageConfig = {
  provider: (process.env.STORAGE_PROVIDER as StorageProvider) || "LOCAL",
  localBasePath: process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), "uploads"),
  supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || "studytrack-uploads",
  s3Bucket: process.env.S3_BUCKET,
  s3Region: process.env.S3_REGION,
  s3AccessKey: process.env.S3_ACCESS_KEY,
  s3SecretKey: process.env.S3_SECRET_KEY,
  publicBaseUrl: process.env.STORAGE_PUBLIC_URL || "",
};

function getUserFolder(userId: string): string {
  const partition = userId.substring(0, 2);
  return path.join("users", partition, userId).replace(/\\/g, "/");
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
  await fs.unlink(fullPath).catch(err => console.error('Failed to delete local file:', fullPath, err));
}

async function saveToSupabase(storageKey: string, buffer: Buffer, mimeType: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(config.supabaseBucket)
    .upload(storageKey, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('[SUPABASE STORAGE] Upload failed:', error.message);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(config.supabaseBucket)
    .getPublicUrl(storageKey);

  return urlData?.publicUrl || null;
}

async function getFromSupabase(storageKey: string): Promise<Buffer | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(config.supabaseBucket)
    .download(storageKey);

  if (error || !data) {
    console.error('[SUPABASE STORAGE] Download failed:', error?.message);
    return null;
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function deleteFromSupabase(storageKey: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(config.supabaseBucket)
    .remove([storageKey]);

  if (error) {
    console.error('[SUPABASE STORAGE] Delete failed:', error.message);
  }
}

async function saveToS3(storageKey: string, buffer: Buffer): Promise<void> {
  throw new Error("S3 storage not configured. Set STORAGE_PROVIDER=LOCAL or configure S3 credentials.");
}

export async function saveFile(
  userId: string,
  mimeType: string,
  originalName: string,
  buffer: Buffer
): Promise<StoredFile> {
  if (config.provider === "GOOGLE_DRIVE") {
    try {
      const driveResult = await googleDriveStorage.saveFile(userId, mimeType, originalName, buffer);
      return {
        storageKey: driveResult.fileId,
        provider: "GOOGLE_DRIVE",
        publicUrl: driveResult.viewUrl,
        size: buffer.length,
        metadata: {
          downloadUrl: driveResult.downloadUrl,
          thumbnailUrl: driveResult.thumbnailUrl,
        },
      };
    } catch (driveError: any) {
      console.warn(`[STORAGE] Google Drive upload failed (${driveError.message}), falling back to LOCAL`);
    }
  }

  const storageKey = generateStorageKey(userId, mimeType, originalName);
  let publicUrl: string | null = null;

  if (config.provider === "SUPABASE") {
    publicUrl = await saveToSupabase(storageKey, buffer, mimeType);
  } else if (config.provider === "S3") {
    await saveToS3(storageKey, buffer);
    if (config.publicBaseUrl) {
      publicUrl = `${config.publicBaseUrl.replace(/\/$/, "")}/${storageKey}`;
    }
  } else if (config.provider === "GITHUB") {
    publicUrl = await githubStorage.saveFile(storageKey, buffer);
  } else {
    await saveToLocal(storageKey, buffer);
  }

  return {
    storageKey: publicUrl ? storageKey : storageKey,
    provider: config.provider,
    publicUrl,
    size: buffer.length,
  };
}

export async function getFile(storageKey: string): Promise<Buffer | null> {
  try {
    if (config.provider === "GOOGLE_DRIVE") {
      return await googleDriveStorage.getFile(storageKey);
    }
    if (config.provider === "SUPABASE") {
      return await getFromSupabase(storageKey);
    }
    if (config.provider === "S3") {
      throw new Error("S3 read not implemented");
    }
    if (config.provider === "GITHUB") {
      return await githubStorage.getFile(storageKey);
    }
    return await readFromLocal(storageKey);
  } catch {
    return null;
  }
}

export async function deleteFile(storageKey: string): Promise<void> {
  if (config.provider === "GOOGLE_DRIVE") {
    await googleDriveStorage.deleteFile(storageKey);
  } else if (config.provider === "SUPABASE") {
    await deleteFromSupabase(storageKey);
  } else if (config.provider === "S3") {
    // S3 delete placeholder
  } else if (config.provider === "GITHUB") {
    await githubStorage.deleteFile(storageKey);
  } else {
    await deleteFromLocal(storageKey);
  }
}

export async function fileExists(storageKey: string): Promise<boolean> {
  if (config.provider === "GOOGLE_DRIVE") {
    return googleDriveStorage.fileExists(storageKey);
  }
  if (config.provider === "SUPABASE") {
    const { data } = await supabaseAdmin.storage
      .from(config.supabaseBucket)
      .list("", { search: storageKey });
    return (data?.length ?? 0) > 0;
  }
  if (config.provider === "S3") {
    return false;
  }
  if (config.provider === "GITHUB") {
    return githubStorage.fileExists(storageKey);
  }
  return existsOnLocal(storageKey);
}

export function getLocalPath(storageKey: string): string {
  return path.join(config.localBasePath, storageKey);
}

export async function renameFile(storageKey: string, newName: string): Promise<void> {
  if (config.provider === "GOOGLE_DRIVE") {
    await googleDriveStorage.renameFile(storageKey, newName);
  } else if (config.provider === "LOCAL") {
    const oldPath = getLocalPath(storageKey);
    const newPath = path.join(path.dirname(oldPath), newName);
    await fs.rename(oldPath, newPath).catch(err => console.error('Rename failed:', oldPath, '->', newPath, err));
  }
}
