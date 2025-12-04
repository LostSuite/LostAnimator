/**
 * Convert time in seconds to pixel position
 */
export function timeToPixel(time: number, pixelsPerSecond: number): number {
  return time * pixelsPerSecond;
}

/**
 * Convert pixel position to time in seconds
 */
export function pixelToTime(pixel: number, pixelsPerSecond: number): number {
  return pixel / pixelsPerSecond;
}

/**
 * Snap a time value to the nearest grid position
 */
export function snapToGrid(time: number, gridSize: number): number {
  return Math.round(time / gridSize) * gridSize;
}

/**
 * Format time in seconds to display string (e.g., "1.50s")
 */
export function formatTime(time: number): string {
  return `${time.toFixed(2)}s`;
}

/**
 * Generate tick marks for the timeline ruler
 */
export function generateRulerTicks(
  duration: number,
  pixelsPerSecond: number,
  minorTickInterval: number = 0.1,
  majorTickInterval: number = 0.5
): { position: number; time: number; isMajor: boolean }[] {
  const ticks: { position: number; time: number; isMajor: boolean }[] = [];
  const maxTime = Math.ceil(duration / minorTickInterval) * minorTickInterval + 0.5;

  for (let time = 0; time <= maxTime; time += minorTickInterval) {
    const roundedTime = Math.round(time * 1000) / 1000; // Fix floating point errors
    const isMajor = Math.abs(roundedTime % majorTickInterval) < 0.001;
    ticks.push({
      position: timeToPixel(roundedTime, pixelsPerSecond),
      time: roundedTime,
      isMajor,
    });
  }

  return ticks;
}
