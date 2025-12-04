import { describe, it, expect } from "vitest";
import {
  createDefaultAnimationFile,
  createDefaultAnimation,
} from "./animation";

describe("animation types", () => {
  describe("createDefaultAnimationFile", () => {
    it("creates a valid animation file structure", () => {
      const file = createDefaultAnimationFile();
      expect(file.version).toBe("1.0");
      expect(file.spritesheets).toEqual([]);
      expect(file.animations).toEqual([]);
    });

    it("creates a new object each time", () => {
      const file1 = createDefaultAnimationFile();
      const file2 = createDefaultAnimationFile();
      expect(file1).not.toBe(file2);
      expect(file1.animations).not.toBe(file2.animations);
    });
  });

  describe("createDefaultAnimation", () => {
    it("creates an animation with given id and name", () => {
      const animation = createDefaultAnimation("test-id", "Test Animation");
      expect(animation.id).toBe("test-id");
      expect(animation.name).toBe("Test Animation");
    });

    it("sets loop to true by default", () => {
      const animation = createDefaultAnimation("id", "name");
      expect(animation.loop).toBe(true);
    });

    it("initializes with empty tracks array", () => {
      const animation = createDefaultAnimation("id", "name");
      expect(animation.tracks).toEqual([]);
    });

    it("creates a new object each time", () => {
      const anim1 = createDefaultAnimation("id1", "name1");
      const anim2 = createDefaultAnimation("id2", "name2");
      expect(anim1).not.toBe(anim2);
      expect(anim1.tracks).not.toBe(anim2.tracks);
    });
  });
});
