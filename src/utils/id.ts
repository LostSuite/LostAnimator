/**
 * Generate a unique ID for animations, tracks, and keys
 */
export function generateId(): string {
  return crypto.randomUUID();
}
