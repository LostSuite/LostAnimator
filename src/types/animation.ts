import { Track } from "./tracks";

export interface Spritesheet {
  id: string;
  name: string;  // Display name from filename
  imagePath: string;
  tileWidth: number;
  tileHeight: number;
  // columns and rows are computed from image dimensions / tile dimensions
}

export interface AnimationFile {
  version: "1.0";
  spritesheets: Spritesheet[];
  animations: Animation[];
}

export interface Animation {
  id: string;
  name: string;
  loop: boolean;
  duration: number; // Total animation duration in seconds
  tracks: Track[];
}

export function createDefaultAnimationFile(): AnimationFile {
  return {
    version: "1.0",
    spritesheets: [],
    animations: [],
  };
}

export function createDefaultAnimation(id: string, name: string): Animation {
  return {
    id,
    name,
    loop: true,
    duration: 1, // Default 1 second
    tracks: [],
  };
}
