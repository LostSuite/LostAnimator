// Discriminated union for track types
export type Track = SpriteTrack | TweenTrack | EventTrack;

export interface SpriteTrack {
  type: "sprite";
  id: string;
  keys: SpriteKey[];
}

export interface TweenTrack {
  type: "tween";
  id: string;
  keys: TweenKey[];
}

export interface EventTrack {
  type: "event";
  id: string;
  keys: EventKey[];
}

// Discriminated union for key types
export type Key = SpriteKey | TweenKey | EventKey;

export interface SpriteKey {
  type: "sprite";
  id: string;
  time: number;
  frame: [number, number]; // [column, row] in grid
  spritesheetId?: string;  // Which spritesheet to use (defaults to first)
  flip?: "horizontal" | "vertical" | "both";
}

export interface TweenKey {
  type: "tween";
  id: string;
  time: number;
  duration: number;
  name: string;
  easing: EasingType;
}

export interface EventKey {
  type: "event";
  id: string;
  time: number;
  name: string;
}

export type EasingType =
  | "Linear"
  | "EaseIn"
  | "EaseOut"
  | "EaseInOut"
  | "BounceIn"
  | "BounceOut";

export type TrackType = "sprite" | "tween" | "event";

export function createSpriteTrack(id: string): SpriteTrack {
  return { type: "sprite", id, keys: [] };
}

export function createTweenTrack(id: string): TweenTrack {
  return { type: "tween", id, keys: [] };
}

export function createEventTrack(id: string): EventTrack {
  return { type: "event", id, keys: [] };
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

export function getKeyEndTime(key: Key): number {
  if (key.type === "event" || key.type === "sprite") {
    // Events and sprite keys are markers (no inherent duration)
    return key.time;
  }
  return key.time + key.duration;
}

export function getTrackDuration(track: Track): number {
  if (track.keys.length === 0) return 0;
  return Math.max(...track.keys.map(getKeyEndTime));
}

/**
 * Calculate the duration of a sprite key based on the next key in the track
 * or the animation's total duration if it's the last key.
 */
export function getSpriteKeyDuration(
  key: SpriteKey,
  track: SpriteTrack,
  animationDuration: number
): number {
  // Sort keys by time
  const sortedKeys = [...track.keys].sort((a, b) => a.time - b.time);
  const keyIndex = sortedKeys.findIndex((k) => k.id === key.id);

  if (keyIndex === -1) return 0;

  // If there's a next key, duration is until that key
  if (keyIndex < sortedKeys.length - 1) {
    return sortedKeys[keyIndex + 1].time - key.time;
  }

  // Otherwise, duration is until the animation ends
  return Math.max(0, animationDuration - key.time);
}
