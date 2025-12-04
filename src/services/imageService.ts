import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

// Cache for loaded images
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load an image from a file path
 */
export async function loadImage(path: string): Promise<HTMLImageElement> {
  // Check cache first
  const cached = imageCache.get(path);
  if (cached) {
    return cached;
  }

  // Read file as binary
  const data = await readFile(path);

  // Convert to blob URL
  const blob = new Blob([data], { type: getMimeType(path) });
  const url = URL.createObjectURL(blob);

  // Create image element
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      imageCache.set(path, img);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${path}`));
    };
    img.src = url;
  });
}

/**
 * Open an image file using native file dialog
 */
export async function openImageFile(): Promise<{
  path: string;
  image: HTMLImageElement;
} | null> {
  const selected = await open({
    title: "Open Spritesheet",
    filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }],
  });

  if (!selected) return null;

  const image = await loadImage(selected);
  return { path: selected, image };
}

/**
 * Clear a specific image from cache
 */
export function clearImageCache(path: string): void {
  const img = imageCache.get(path);
  if (img && img.src.startsWith("blob:")) {
    URL.revokeObjectURL(img.src);
  }
  imageCache.delete(path);
}

/**
 * Clear all cached images
 */
export function clearAllImageCache(): void {
  for (const [path] of imageCache) {
    clearImageCache(path);
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(path: string): string {
  const ext = path.toLowerCase().split(".").pop();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}
