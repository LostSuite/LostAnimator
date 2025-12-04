import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Tauri APIs
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(() => Promise.resolve()),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(() => Promise.resolve(null)),
  save: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(() => Promise.resolve("")),
  writeTextFile: vi.fn(() => Promise.resolve()),
  readFile: vi.fn(() => Promise.resolve(new Uint8Array())),
}));
