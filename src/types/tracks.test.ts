import { describe, it, expect } from "vitest";
import {
  createSpriteTrack,
  createTweenTrack,
  createEventTrack,
  createSpriteKey,
  createTweenKey,
  createEventKey,
  getKeyEndTime,
  getTrackDuration,
} from "./tracks";

describe("track creators", () => {
  describe("createSpriteTrack", () => {
    it("creates a sprite track with correct type", () => {
      const track = createSpriteTrack("track-1", "Sprite");
      expect(track.type).toBe("sprite");
      expect(track.id).toBe("track-1");
      expect(track.name).toBe("Sprite");
      expect(track.keys).toEqual([]);
    });
  });

  describe("createTweenTrack", () => {
    it("creates a tween track with correct type", () => {
      const track = createTweenTrack("track-2", "Tween");
      expect(track.type).toBe("tween");
      expect(track.id).toBe("track-2");
      expect(track.name).toBe("Tween");
      expect(track.keys).toEqual([]);
    });
  });

  describe("createEventTrack", () => {
    it("creates an event track with correct type", () => {
      const track = createEventTrack("track-3", "Event");
      expect(track.type).toBe("event");
      expect(track.id).toBe("track-3");
      expect(track.name).toBe("Event");
      expect(track.keys).toEqual([]);
    });
  });
});

describe("key creators", () => {
  describe("createSpriteKey", () => {
    it("creates a sprite key with all properties", () => {
      const key = createSpriteKey("key-1", 0.5, [2, 3]);
      expect(key.id).toBe("key-1");
      expect(key.time).toBe(0.5);
      expect(key.frame).toEqual([2, 3]);
    });
  });

  describe("createTweenKey", () => {
    it("creates a tween key with default easing", () => {
      const key = createTweenKey("key-2", 1, 0.5, "scale");
      expect(key.id).toBe("key-2");
      expect(key.time).toBe(1);
      expect(key.duration).toBe(0.5);
      expect(key.name).toBe("scale");
      expect(key.easing).toBe("Linear");
    });

    it("creates a tween key with custom easing", () => {
      const key = createTweenKey("key-3", 0, 1, "fade", "EaseInOut");
      expect(key.easing).toBe("EaseInOut");
    });
  });

  describe("createEventKey", () => {
    it("creates an event key", () => {
      const key = createEventKey("key-4", 2.5, "jump");
      expect(key.id).toBe("key-4");
      expect(key.time).toBe(2.5);
      expect(key.name).toBe("jump");
    });
  });
});

describe("getKeyEndTime", () => {
  it("returns just time for sprite keys (duration calculated elsewhere)", () => {
    const key = createSpriteKey("id", 1, [0, 0]);
    expect(getKeyEndTime(key)).toBe(1);
  });

  it("returns time + duration for tween keys", () => {
    const key = createTweenKey("id", 2, 1, "scale");
    expect(getKeyEndTime(key)).toBe(3);
  });

  it("returns just time for event keys (no duration)", () => {
    const key = createEventKey("id", 1.5, "event");
    expect(getKeyEndTime(key)).toBe(1.5);
  });
});

describe("getTrackDuration", () => {
  it("returns 0 for empty tracks", () => {
    const track = createSpriteTrack("id", "Test");
    expect(getTrackDuration(track)).toBe(0);
  });

  it("returns the time of the last sprite key", () => {
    const track = createSpriteTrack("id", "Test");
    track.keys.push(createSpriteKey("k1", 0, [0, 0]));
    track.keys.push(createSpriteKey("k2", 0.5, [1, 0]));
    // Sprite keys no longer have duration, so max is just the last time
    expect(getTrackDuration(track)).toBe(0.5);
  });

  it("handles keys that are not in chronological order", () => {
    const track = createSpriteTrack("id", "Test");
    track.keys.push(createSpriteKey("k1", 2, [0, 0]));
    track.keys.push(createSpriteKey("k2", 0, [1, 0]));
    // Max time is 2 (sprite keys have no duration)
    expect(getTrackDuration(track)).toBe(2);
  });

  it("handles event tracks correctly", () => {
    const track = createEventTrack("id", "Test");
    track.keys.push(createEventKey("k1", 1, "start"));
    track.keys.push(createEventKey("k2", 3, "end"));
    expect(getTrackDuration(track)).toBe(3);
  });

  it("handles tween tracks with duration", () => {
    const track = createTweenTrack("id", "Test");
    track.keys.push(createTweenKey("k1", 0, 0.5, "scale"));
    track.keys.push(createTweenKey("k2", 1, 0.5, "fade"));
    // Tween keys have duration, so max end time is 1 + 0.5 = 1.5
    expect(getTrackDuration(track)).toBe(1.5);
  });
});
