import path from "path";
import fsSync from "fs";

export interface GoogleDriveConfig {
  clientEmail: string;
  privateKey: string;
  folderId: string;
  folderName: string;
  folderUrl: string;
  nestedFolders: boolean; // default true
}

/**
 * Extracts Google Drive Folder ID from a Drive URL
 */
export function extractFolderId(url: string): string {
  if (!url) return "";
  
  // Match standard folder link: drive.google.com/drive/folders/ID or drive.google.com/drive/u/0/folders/ID
  const matchFolders = url.match(/\/folders\/([a-zA-Z0-9_-]{25,})/);
  if (matchFolders && matchFolders[1]) {
    return matchFolders[1];
  }
  
  // Match open/id format: drive.google.com/open?id=ID
  const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
  }
  
  // If it doesn't match a URL, check if it's already a raw ID
  if (/^[a-zA-Z0-9_-]{25,}$/.test(url)) {
    return url;
  }
  
  return "";
}

/**
 * Loads service account credentials from a JSON file or environment variables
 */
function loadCredentials(): { clientEmail: string; privateKey: string } {
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // 1. Try reading from the specified file path
  if (credsPath) {
    try {
      const absolutePath = path.isAbsolute(credsPath) 
        ? credsPath 
        : path.resolve(process.cwd(), credsPath);
        
      if (fsSync.existsSync(absolutePath)) {
        const fileContent = fsSync.readFileSync(absolutePath, "utf-8");
        const creds = JSON.parse(fileContent);
        if (creds.client_email && creds.private_key) {
          return {
            clientEmail: creds.client_email,
            privateKey: creds.private_key,
          };
        }
      }
    } catch (err: any) {
      console.warn("Failed to load credentials from path in GOOGLE_APPLICATION_CREDENTIALS:", err.message);
    }
  }

  // 2. Fallback to individual environment variables
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL || "";
  const privateKey = (process.env.GOOGLE_DRIVE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  
  // 3. Fallback to full credentials JSON string in env
  const credsJson = process.env.GOOGLE_DRIVE_CREDENTIALS_JSON;
  if (credsJson) {
    try {
      const creds = JSON.parse(credsJson);
      return {
        clientEmail: creds.client_email || clientEmail,
        privateKey: creds.private_key || privateKey,
      };
    } catch {
      // Ignored
    }
  }

  return { clientEmail, privateKey };
}

export function getGoogleDriveConfig(): GoogleDriveConfig {
  const folderUrl = process.env.GOOGLE_DRIVE_FOLDER_URL || "";
  const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME || "Cognarc Storage";
  
  // Extract ID from URL if not explicitly provided
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
  if (!folderId && folderUrl) {
    folderId = extractFolderId(folderUrl);
  }
  
  const { clientEmail, privateKey } = loadCredentials();
  
  const nestedFolders = process.env.GOOGLE_DRIVE_NESTED_FOLDERS !== "false";

  return {
    clientEmail,
    privateKey,
    folderId,
    folderName,
    folderUrl,
    nestedFolders,
  };
}
