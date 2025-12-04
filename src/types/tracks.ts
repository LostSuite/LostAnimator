import { z } from "zod";

// Easing types
export const EasingTypeSchema = z.enum([
  "Linear",
  "EaseIn",
  "EaseOut",
  "EaseInOut",
  "BounceIn",
  "BounceOut",
]);
export type EasingType = z.infer<typeof EasingTypeSchema>;

// Key schemas
export const SpriteKeySchema = z.object({
  type: z.literal("sprite"),
  id: z.string(),
  time: z.number(),
  frame: z.tuple([z.number(), z.number()]),
  spritesheetId: z.string().optional(),
  flip: z.enum(["horizontal", "vertical", "both"]).optional(),
});
export type SpriteKey = z.infer<typeof SpriteKeySchema>;

export const TweenKeySchema = z.object({
  type: z.literal("tween"),
  id: z.string(),
  time: z.number(),
  duration: z.number(),
  name: z.string(),
  easing: EasingTypeSchema,
});
export type TweenKey = z.infer<typeof TweenKeySchema>;

export const EventKeySchema = z.object({
  type: z.literal("event"),
  id: z.string(),
  time: z.number(),
  name: z.string(),
});
export type EventKey = z.infer<typeof EventKeySchema>;

export const KeySchema = z.discriminatedUnion("type", [
  SpriteKeySchema,
  TweenKeySchema,
  EventKeySchema,
]);
export type Key = z.infer<typeof KeySchema>;

// Track schemas
export const SpriteTrackSchema = z.object({
  type: z.literal("sprite"),
  id: z.string(),
  name: z.string(),
  keys: z.array(SpriteKeySchema),
});
export type SpriteTrack = z.infer<typeof SpriteTrackSchema>;

export const TweenTrackSchema = z.object({
  type: z.literal("tween"),
  id: z.string(),
  name: z.string(),
  keys: z.array(TweenKeySchema),
});
export type TweenTrack = z.infer<typeof TweenTrackSchema>;

export const EventTrackSchema = z.object({
  type: z.literal("event"),
  id: z.string(),
  name: z.string(),
  keys: z.array(EventKeySchema),
});
export type EventTrack = z.infer<typeof EventTrackSchema>;

export const TrackSchema = z.discriminatedUnion("type", [
  SpriteTrackSchema,
  TweenTrackSchema,
  EventTrackSchema,
]);
export type Track = z.infer<typeof TrackSchema>;

export const TrackTypeSchema = z.enum(["sprite", "tween", "event"]);
export type TrackType = z.infer<typeof TrackTypeSchema>;

// Factory functions
export function createSpriteTrack(id: string, name: string): SpriteTrack {
  return { type: "sprite", id, name, keys: [] };
}

export function createTweenTrack(id: string, name: string): TweenTrack {
  return { type: "tween", id, name, keys: [] };
}

export function createEventTrack(id: string, name: string): EventTrack {
  return { type: "event", id, name, keys: [] };
}

export function createSpriteKey(
  id: string,
  time: number,
  frame: [number, number]
): SpriteKey {
  return { type: "sprite", id, time, frame };
}

export function createTweenKey(
  id: string,
  time: number,
  duration: number,
  name: string,
  easing: EasingType = "Linear"
): TweenKey {
  return { type: "tween", id, time, duration, name, easing };
}

export function createEventKey(id: string, time: number, name: string): EventKey {
  return { type: "event", id, time, name };
}

// Utility functions
export function getKeyEndTime(key: Key): number {
  if (key.type === "event" || key.type === "sprite") {
    return key.time;
  }
  return key.time + key.duration;
}

export function getTrackDuration(track: Track): number {
  if (track.keys.length === 0) return 0;
  return Math.max(...track.keys.map(getKeyEndTime));
}

export function getSpriteKeyDuration(
  key: SpriteKey,
  track: SpriteTrack,
  animationDuration: number
): number {
  const sortedKeys = [...track.keys].sort((a, b) => a.time - b.time);
  const keyIndex = sortedKeys.findIndex((k) => k.id === key.id);

  if (keyIndex === -1) return 0;

  if (keyIndex < sortedKeys.length - 1) {
    return sortedKeys[keyIndex + 1].time - key.time;
  }

  return Math.max(0, animationDuration - key.time);
}
