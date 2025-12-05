import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { AnimationFile, AnimationFileSchema, createDefaultAnimationFile } from "../types";

export interface OpenFileResult {
  path: string;
  content: AnimationFile;
}

/**
 * Get the directory from a file path
 */
function getDirectory(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash >= 0 ? filePath.slice(0, lastSlash) : "";
}

/**
 * Convert an absolute path to a relative path from a base directory
 */
function toRelativePath(absolutePath: string, baseDir: string): string {
  // If already relative (doesn't start with /), return as-is
  if (!absolutePath.startsWith("/")) return absolutePath;

  // Simple case: if the file is in the same directory or a subdirectory
  if (absolutePath.startsWith(baseDir + "/")) {
    return absolutePath.slice(baseDir.length + 1);
  }

  // For now, keep absolute paths that are outside the base directory
  // A more complex implementation would calculate ../.. paths
  return absolutePath;
}

/**
 * Convert a relative path to an absolute path from a base directory
 */
function toAbsolutePath(relativePath: string, baseDir: string): string {
  // If already absolute (starts with /), return as-is
  if (relativePath.startsWith("/")) return relativePath;

  return baseDir + "/" + relativePath;
}

/**
 * Open an animation file using native file dialog
 */
export async function openAnimationFile(): Promise<OpenFileResult | null> {
  const selected = await open({
    title: "Open Animation File",
    filters: [{ name: "Animation", extensions: ["json", "anim"] }],
  });

  if (!selected) return null;

  const content = await readTextFile(selected);
  const rawData = JSON.parse(content);
  const baseDir = getDirectory(selected);

  // Parse with Zod schema - this strips unknown fields like legacy 'type' on keys
  const parsed = AnimationFileSchema.parse(rawData);

  // Convert relative spritesheet paths to absolute
  const contentWithAbsolutePaths: AnimationFile = {
    ...parsed,
    spritesheets: parsed.spritesheets.map((s) => ({
      ...s,
      imagePath: toAbsolutePath(s.imagePath, baseDir),
    })),
  };

  return { path: selected, content: contentWithAbsolutePaths };
}

/**
 * Save an animation file. If no path is provided, shows save dialog.
 */
export async function saveAnimationFile(
  content: AnimationFile,
  path: string | null
): Promise<string | null> {
  let targetPath = path;

  if (!targetPath) {
    const selected = await save({
      title: "Save Animation File",
      defaultPath: "animation.json",
      filters: [{ name: "Animation", extensions: ["json"] }],
    });

    if (!selected) return null;
    targetPath = selected;
  }

  const baseDir = getDirectory(targetPath);

  // Convert absolute spritesheet paths to relative for portability
  const contentWithRelativePaths: AnimationFile = {
    ...content,
    spritesheets: content.spritesheets.map((s) => ({
      ...s,
      imagePath: toRelativePath(s.imagePath, baseDir),
    })),
  };

  // Validate with Zod before saving to ensure data integrity
  const validated = AnimationFileSchema.parse(contentWithRelativePaths);

  await writeTextFile(targetPath, JSON.stringify(validated, null, 2));
  return targetPath;
}

/**
 * Create a new empty animation file
 */
export function createNewFile(): AnimationFile {
  return createDefaultAnimationFile();
}
