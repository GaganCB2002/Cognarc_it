import { toast } from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://cognarc-it-1.onrender.com/api";

export async function downloadFile(fileId: string, filename: string) {
  if (typeof window === "undefined") return;
  try {
    const link = document.createElement("a");
    link.href = `${BASE}/upload/${fileId}/download`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  } catch {
    toast.error("Download failed");
  }
}

export async function copyLink(fileId: string) {
  if (typeof navigator === "undefined") return;
  try {
    const url = `${BASE}/upload/${fileId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  } catch {
    toast.error("Failed to copy link");
  }
}

export async function shareResource(title: string, url: string) {
  if (typeof navigator === "undefined") return;
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      toast.success("Shared successfully");
    } catch {
      // user cancelled
    }
  } else {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard (share not supported)");
  }
}

export async function duplicateItem<T>(
  apiClient: { post: (endpoint: string, payload: unknown) => Promise<unknown> },
  endpoint: string,
  id: string,
  data: Partial<T>,
  transform?: (original: T) => T
) {
  try {
    const payload = transform ? transform(data as T) : { ...data, title: `${(data as Partial<T & { title: string }>).title || "Untitled"} (Copy)` };
    const res = await apiClient.post(endpoint, payload);
    toast.success("Duplicated successfully");
    return res;
  } catch {
    toast.error("Duplicate failed");
    return null;
  }
}
