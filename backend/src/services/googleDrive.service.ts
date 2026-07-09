import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

interface GoogleDriveConfig {
  clientEmail: string;
  privateKey: string;
  folderId: string;
}

const config: GoogleDriveConfig = {
  clientEmail: process.env.GOOGLE_DRIVE_CLIENT_EMAIL || "",
  privateKey: (process.env.GOOGLE_DRIVE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
};

function getDriveClient(): drive_v3.Drive {
  if (!config.clientEmail || !config.privateKey || !config.folderId) {
    throw new Error(
      "Google Drive not configured. Set GOOGLE_DRIVE_CLIENT_EMAIL, " +
      "GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID in .env"
    );
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function saveFile(storageKey: string, buffer: Buffer): Promise<string> {
  const drive = getDriveClient();
  const fileName = storageKey.split("/").pop() || storageKey;

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [config.folderId],
      mimeType: "application/octet-stream",
    },
    media: {
      mimeType: "application/octet-stream",
      body: bufferToStream(buffer),
    },
    fields: "id, webViewLink, webContentLink",
  });

  const fileId = response.data.id;
  if (!fileId) throw new Error("Failed to create Google Drive file");

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const publicUrl = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
  return publicUrl;
}

export async function getFile(storageKey: string): Promise<Buffer | null> {
  try {
    const drive = getDriveClient();
    const fileId = await resolveFileId(storageKey);
    if (!fileId) return null;

    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    return Buffer.from(response.data as ArrayBuffer);
  } catch {
    return null;
  }
}

export async function deleteFile(storageKey: string): Promise<void> {
  try {
    const drive = getDriveClient();
    const fileId = await resolveFileId(storageKey);
    if (!fileId) return;

    await drive.files.delete({ fileId });
  } catch {
    // Silently ignore — file may already be gone
  }
}

export async function fileExists(storageKey: string): Promise<boolean> {
  try {
    const drive = getDriveClient();
    const fileId = await resolveFileId(storageKey);
    if (!fileId) return false;

    await drive.files.get({ fileId, fields: "id" });
    return true;
  } catch {
    return false;
  }
}

async function resolveFileId(storageKey: string): Promise<string | null> {
  try {
    const drive = getDriveClient();
    const fileName = storageKey.split("/").pop() || storageKey;

    const response = await drive.files.list({
      q: `name = '${fileName.replace(/'/g, "\\'")}' and '${config.folderId}' in parents and trashed = false`,
      fields: "files(id, name)",
      pageSize: 1,
    });

    const file = response.data.files?.[0];
    return file?.id || null;
  } catch {
    return null;
  }
}
