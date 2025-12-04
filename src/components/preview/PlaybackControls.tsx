import { useEffect, useRef } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import { getTrackDuration } from "../../types";
import { formatTime } from "../../utils/timelineUtils";

// SVG Icon components
const SkipBackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const StepBackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 19 2 12 11 5 11 19" />
    <polygon points="22 19 13 12 22 5 22 19" />
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const StepForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 19 22 12 13 5 13 19" />
    <polygon points="2 19 11 12 2 5 2 19" />
  </svg>
);

const SkipForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export function PlaybackControls() {
  const {
    playback,
    play,
    pause,
    stop,
    setCurrentTime,
    selectedAnimation,
  } = useAnimator();

  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Calculate total duration
  const totalDuration = selectedAnimation
    ? Math.max(
        ...selectedAnimation.tracks.map(getTrackDuration),
        0.1
      )
    : 0;

  // Animation loop
  useEffect(() => {
    if (!playback.isPlaying || !selectedAnimation) {
      return;
    }

    const tick = (timestamp: number) => {
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      let newTime = playback.currentTime + delta * playback.playbackSpeed;

      if (newTime >= totalDuration) {
        if (selectedAnimation.loop) {
          newTime = newTime % totalDuration;
        } else {
          newTime = totalDuration;
          pause();
        }
      }

      setCurrentTime(newTime);

      if (playback.isPlaying) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    playback.isPlaying,
    playback.currentTime,
    playback.playbackSpeed,
    selectedAnimation,
    totalDuration,
    setCurrentTime,
    pause,
  ]);

  const stepBackward = () => {
    setCurrentTime(Math.max(0, playback.currentTime - 0.05));
  };

  const stepForward = () => {
    setCurrentTime(Math.min(totalDuration, playback.currentTime + 0.05));
  };

  const goToStart = () => {
    setCurrentTime(0);
  };

  const goToEnd = () => {
    setCurrentTime(totalDuration);
  };

  return (
    <div className="h-10 flex-shrink-0 border-t border-zinc-700 flex items-center justify-center gap-1 px-4">
      <button
        onClick={goToStart}
        className="p-2 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100"
        title="Go to start"
      >
        <SkipBackIcon />
      </button>
      <button
        onClick={stepBackward}
        className="p-2 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100"
        title="Step backward"
      >
        <StepBackIcon />
      </button>
      <button
        onClick={playback.isPlaying ? pause : play}
        className="p-2 px-3 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors text-zinc-100"
        title={playback.isPlaying ? "Pause" : "Play"}
      >
        {playback.isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button
        onClick={stepForward}
        className="p-2 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100"
        title="Step forward"
      >
        <StepForwardIcon />
      </button>
      <button
        onClick={goToEnd}
        className="p-2 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100"
        title="Go to end"
      >
        <SkipForwardIcon />
      </button>
      <button
        onClick={stop}
        className="p-2 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100"
        title="Stop"
      >
        <StopIcon />
      </button>

      <div className="w-px h-5 bg-zinc-600 mx-2" />

      <span className="text-xs text-zinc-400 font-mono min-w-[80px]">
        {formatTime(playback.currentTime)} / {formatTime(totalDuration)}
      </span>
    </div>
  );
}
