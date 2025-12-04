import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { AnimationFile, createDefaultAnimationFile } from "../types";

export interface OpenFileResult {
  path: string;
  content: AnimationFile;
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
  const parsed = JSON.parse(content) as AnimationFile;

  return { path: selected, content: parsed };
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

  await writeTextFile(targetPath, JSON.stringify(content, null, 2));
  return targetPath;
}

/**
 * Create a new empty animation file
 */
export function createNewFile(): AnimationFile {
  return createDefaultAnimationFile();
}
