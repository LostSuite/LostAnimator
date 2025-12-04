// Discriminated union for type-safe selection
export type SelectionState =
  | { type: "none" }
  | { type: "animation"; animationId: string }
  | { type: "track"; animationId: string; trackId: string }
  | { type: "key"; animationId: string; trackId: string; keyId: string };

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
}

export interface TimelineViewState {
  zoom: number; // Pixels per second
  scrollX: number;
  snapToGrid: boolean;
  gridSize: number; // Snap grid in seconds
}

export function createDefaultPlaybackState(): PlaybackState {
  return {
    isPlaying: false,
    currentTime: 0,
    playbackSpeed: 1.0,
  };
}

export function createDefaultTimelineViewState(): TimelineViewState {
  return {
    zoom: 200, // 200 pixels per second
    scrollX: 0,
    snapToGrid: true,
    gridSize: 0.05, // 50ms snap
  };
}
