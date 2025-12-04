import { describe, it, expect } from "vitest";
import { generateId } from "./id";

describe("generateId", () => {
  it("generates a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
  });

  it("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it("generates valid UUID format", () => {
    const id = generateId();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });
});
