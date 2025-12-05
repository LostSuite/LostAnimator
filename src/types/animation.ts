import { z } from "zod";
import { TrackSchema } from "./tracks";

export const SpritesheetSchema = z.object({
  id: z.string(),
  name: z.string(),
  imagePath: z.string(),
  tileWidth: z.number(),
  tileHeight: z.number(),
});
export type Spritesheet = z.infer<typeof SpritesheetSchema>;

export const AnimationSchema = z.object({
  id: z.string(),
  name: z.string(),
  loop: z.boolean(),
  duration: z.number(),
  tracks: z.array(TrackSchema),
  // Editor settings per animation
  snapToGrid: z.boolean().default(true),
  gridSize: z.number().default(0.1),
});
export type Animation = z.infer<typeof AnimationSchema>;

export const AnimationFileSchema = z.object({
  version: z.literal("1.0"),
  spritesheets: z.array(SpritesheetSchema),
  animations: z.array(AnimationSchema),
});
export type AnimationFile = z.infer<typeof AnimationFileSchema>;

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
    snapToGrid: true,
    gridSize: 0.1,
  };
}
