import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";
import { getGoogleDriveConfig } from "../config/googleDrive";
import { generateUniqueFilename } from "../utils/fileNaming";

// Simple retry helper
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    console.warn(`Google Drive API call failed, retrying in ${delay}ms... (Retries left: ${retries - 1})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

let driveClientInstance: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (driveClientInstance) return driveClientInstance;

  const config = getGoogleDriveConfig();
  if (!config.clientEmail || !config.privateKey || !config.folderId) {
    throw new Error(
      "Google Drive not properly configured. Ensure GOOGLE_APPLICATION_CREDENTIALS (or GOOGLE_DRIVE_CLIENT_EMAIL and GOOGLE_DRIVE_PRIVATE_KEY) and GOOGLE_DRIVE_FOLDER_URL are set."
    );
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  driveClientInstance = google.drive({ version: "v3", auth });
  return driveClientInstance;
}

/**
 * Find or create a folder under a parent folder
 */
async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = getDriveClient();
  
  // Search for folder
  const response = await retry(async () => 
    await drive.files.list({
      q: `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
      pageSize: 1,
    })
  );

  const existingFolder = response.data.files?.[0];
  if (existingFolder?.id) {
    return existingFolder.id;
  }

  // Create folder if it doesn't exist
  const createResponse = await retry(async () =>
    await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id",
    })
  );

  const newFolderId = createResponse.data.id;
  if (!newFolderId) throw new Error(`Failed to create Google Drive folder: ${name}`);
  return newFolderId;
}

/**
 * Resolves the destination folder ID for a user upload based on configurations
 */
async function getUploadFolderId(userId: string): Promise<string> {
  const config = getGoogleDriveConfig();
  if (!config.nestedFolders) {
    return config.folderId;
  }

  // Find or create 'Users' folder under the root folder
  const usersFolderId = await findOrCreateFolder("Users", config.folderId);
  
  // Find or create user folder 'User_[userId]' under 'Users'
  const userFolderId = await findOrCreateFolder(`User_${userId}`, usersFolderId);

  return userFolderId;
}

export interface GoogleDriveUploadResult {
  fileId: string;
  viewUrl: string;
  downloadUrl: string;
  thumbnailUrl?: string;
}

/**
 * Uploads a file buffer to Google Drive
 */
export async function saveFile(
  userId: string,
  mimeType: string,
  originalName: string,
  buffer: Buffer
): Promise<GoogleDriveUploadResult> {
  const drive = getDriveClient();
  const destFolderId = await getUploadFolderId(userId);
  const uniqueName = generateUniqueFilename(userId, originalName);

  // Upload file
  const response = await retry(async () =>
    await drive.files.create({
      requestBody: {
        name: uniqueName,
        parents: [destFolderId],
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: bufferToStream(buffer),
      },
      fields: "id, webViewLink, webContentLink, thumbnailLink",
    })
  );

  const fileId = response.data.id;
  if (!fileId) throw new Error("Failed to create Google Drive file");

  // Make file readable to anyone if public mode is requested
  const publicAccess = process.env.GOOGLE_DRIVE_PUBLIC_ACCESS !== "false";
  if (publicAccess) {
    await retry(async () =>
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      })
    );
  }

  return {
    fileId,
    viewUrl: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    downloadUrl: response.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`,
    thumbnailUrl: response.data.thumbnailLink || undefined,
  };
}

/**
 * Downloads a file from Google Drive as a Buffer
 */
export async function getFile(fileId: string): Promise<Buffer | null> {
  try {
    const drive = getDriveClient();
    const response = await retry(async () =>
      await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" }
      )
    );
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error: any) {
    console.error(`Error downloading file ${fileId} from Google Drive:`, error.message);
    return null;
  }
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await retry(async () => await drive.files.delete({ fileId }));
  } catch (error: any) {
    console.error(`Error deleting file ${fileId} from Google Drive:`, error.message);
  }
}

/**
 * Renames a file in Google Drive
 */
export async function renameFile(fileId: string, newName: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await retry(async () =>
      await drive.files.update({
        fileId,
        requestBody: {
          name: newName,
        },
      })
    );
  } catch (error: any) {
    console.error(`Error renaming file ${fileId} on Google Drive:`, error.message);
    throw error;
  }
}

/**
 * Moves a file to another folder in Google Drive
 */
export async function moveFile(fileId: string, newFolderId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    
    // Retrieve the current parents to remove them
    const file = await retry(async () =>
      await drive.files.get({ fileId, fields: "parents" })
    );
    const previousParents = file.data.parents?.join(",") || "";

    await retry(async () =>
      await drive.files.update({
        fileId,
        addParents: newFolderId,
        removeParents: previousParents,
        fields: "id, parents",
      })
    );
  } catch (error: any) {
    console.error(`Error moving file ${fileId} on Google Drive:`, error.message);
    throw error;
  }
}

/**
 * Check if file exists in Google Drive
 */
export async function fileExists(fileId: string): Promise<boolean> {
  try {
    const drive = getDriveClient();
    await retry(async () => await drive.files.get({ fileId, fields: "id" }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata
 */
export async function getMetadata(fileId: string): Promise<drive_v3.Schema$File> {
  const drive = getDriveClient();
  const response = await retry(async () =>
    await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, webViewLink, webContentLink, parents, createdTime, modifiedTime",
    })
  );
  return response.data;
}
