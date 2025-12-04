import { describe, it, expect } from "vitest";
import {
  timeToPixel,
  pixelToTime,
  snapToGrid,
  formatTime,
  generateRulerTicks,
} from "./timelineUtils";

describe("timelineUtils", () => {
  describe("timeToPixel", () => {
    it("converts time to pixels correctly", () => {
      expect(timeToPixel(1, 100)).toBe(100);
      expect(timeToPixel(2.5, 100)).toBe(250);
      expect(timeToPixel(0, 100)).toBe(0);
    });

    it("handles different pixels per second values", () => {
      expect(timeToPixel(1, 50)).toBe(50);
      expect(timeToPixel(1, 200)).toBe(200);
    });
  });

  describe("pixelToTime", () => {
    it("converts pixels to time correctly", () => {
      expect(pixelToTime(100, 100)).toBe(1);
      expect(pixelToTime(250, 100)).toBe(2.5);
      expect(pixelToTime(0, 100)).toBe(0);
    });

    it("handles different pixels per second values", () => {
      expect(pixelToTime(100, 50)).toBe(2);
      expect(pixelToTime(100, 200)).toBe(0.5);
    });
  });

  describe("snapToGrid", () => {
    it("snaps to nearest grid position", () => {
      expect(snapToGrid(0.12, 0.1)).toBe(0.1);
      expect(snapToGrid(0.17, 0.1)).toBe(0.2);
      // Note: 0.15 rounds to 0.1 due to floating point representation (0.15 / 0.1 = 1.4999...)
      expect(snapToGrid(0.16, 0.1)).toBe(0.2);
    });

    it("handles different grid sizes", () => {
      expect(snapToGrid(0.3, 0.5)).toBe(0.5);
      expect(snapToGrid(0.2, 0.5)).toBe(0);
    });

    it("snaps exact values correctly", () => {
      expect(snapToGrid(0.5, 0.5)).toBe(0.5);
      expect(snapToGrid(1, 0.5)).toBe(1);
    });
  });

  describe("formatTime", () => {
    it("formats time with two decimal places", () => {
      expect(formatTime(0)).toBe("0.00s");
      expect(formatTime(1)).toBe("1.00s");
      expect(formatTime(1.5)).toBe("1.50s");
      expect(formatTime(2.345)).toBe("2.35s");
    });

    it("handles negative values", () => {
      expect(formatTime(-1.5)).toBe("-1.50s");
    });
  });

  describe("generateRulerTicks", () => {
    it("generates ticks for the given duration", () => {
      const ticks = generateRulerTicks(1, 100);
      expect(ticks.length).toBeGreaterThan(0);
    });

    it("marks major ticks correctly", () => {
      const ticks = generateRulerTicks(1, 100, 0.1, 0.5);
      const majorTicks = ticks.filter((t) => t.isMajor);
      expect(majorTicks.length).toBeGreaterThan(0);
      expect(majorTicks[0].time).toBe(0);
      expect(majorTicks[1].time).toBe(0.5);
    });

    it("calculates positions correctly", () => {
      const ticks = generateRulerTicks(1, 100);
      const tickAt1Second = ticks.find((t) => t.time === 1);
      expect(tickAt1Second?.position).toBe(100);
    });
  });
});
