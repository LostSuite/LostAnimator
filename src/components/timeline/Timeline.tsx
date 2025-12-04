import { useCallback, useEffect, useRef } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineTrack } from "./TimelineTrack";
import { Playhead } from "./Playhead";
import { DragNumberInput } from "../ui/DragNumberInput";
import { formatTime } from "../../utils/timelineUtils";

// SVG Icons
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SkipBackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const StepBackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 19 2 12 11 5 11 19" />
    <polygon points="22 19 13 12 22 5 22 19" />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const StepForwardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 19 22 12 13 5 13 19" />
    <polygon points="2 19 11 12 2 5 2 19" />
  </svg>
);

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export function Timeline() {
  const {
    selectedAnimation,
    timeline,
    addTrack,
    playback,
    play,
    pause,
    stop,
    setCurrentTime,
    updateAnimation,
  } = useAnimator();

  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Use animation's duration with some padding for visibility
  const visibleDuration = (selectedAnimation?.duration ?? 1) + 1;
  const totalDuration = selectedAnimation?.duration ?? 1;
  const animationId = selectedAnimation?.id ?? "";

  const handleDurationChange = useCallback((duration: number) => {
    if (!animationId) return;
    updateAnimation(animationId, { duration: Math.max(0.1, duration) });
  }, [animationId, updateAnimation]);

  const handleDurationInput = useCallback((duration: number) => {
    if (!animationId) return;
    updateAnimation(animationId, { duration: Math.max(0.1, duration) });
  }, [animationId, updateAnimation]);

  // Calculate time from mouse position
  const getTimeFromMouseEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const x = e.clientX - rect.left - 100; // 100px for track labels
    return Math.max(0, Math.min(totalDuration, x / timeline.zoom));
  }, [timeline.zoom, totalDuration]);

  // Handle timeline scrubbing (click and drag to move playhead)
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle left click on the timeline background (not on keys)
    if (e.button !== 0) return;

    const time = getTimeFromMouseEvent(e);
    setCurrentTime(time);

    const handleMouseMove = (e: MouseEvent) => {
      const time = getTimeFromMouseEvent(e);
      setCurrentTime(time);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [getTimeFromMouseEvent, setCurrentTime]);

  // Playback animation loop
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
  }, [playback.isPlaying, playback.currentTime, playback.playbackSpeed, selectedAnimation, totalDuration, setCurrentTime, pause]);

  if (!selectedAnimation) {
    return null;
  }

  const stepBackward = () => {
    setCurrentTime(Math.max(0, playback.currentTime - 0.05));
  };

  const stepForward = () => {
    setCurrentTime(Math.min(totalDuration, playback.currentTime + 0.05));
  };

  const goToStart = () => {
    setCurrentTime(0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Timeline header with controls */}
      <div className="h-9 flex-shrink-0 border-b border-zinc-700/50 flex items-center px-3 gap-1 bg-zinc-800/30">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Timeline</span>

        <div className="flex-1" />

        {/* Playback controls */}
        <button onClick={goToStart} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100" title="Go to start">
          <SkipBackIcon />
        </button>
        <button onClick={stepBackward} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100" title="Step back">
          <StepBackIcon />
        </button>
        <button onClick={playback.isPlaying ? pause : play} className="p-1.5 px-2 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-100" title={playback.isPlaying ? "Pause" : "Play"}>
          {playback.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={stepForward} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100" title="Step forward">
          <StepForwardIcon />
        </button>
        <button onClick={stop} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100" title="Stop">
          <StopIcon />
        </button>

        <span className="text-xs text-zinc-400 font-mono mx-2">
          {formatTime(playback.currentTime)} / {formatTime(totalDuration)}
        </span>

        <div className="w-px h-5 bg-zinc-600 mx-1" />

        <DragNumberInput
          value={selectedAnimation.duration}
          onChange={handleDurationChange}
          onInput={handleDurationInput}
          min={0.1}
          max={300}
          dragSpeed={0.02}
          precision={2}
          label="Duration"
          layout="horizontal"
        />
        <div className="relative">
          <select
            onChange={(e) => addTrack(e.target.value as "sprite" | "tween" | "event")}
            value=""
            className="appearance-none bg-zinc-700/50 border border-zinc-600/50 text-xs rounded pl-6 pr-2 py-1 text-zinc-300 cursor-pointer hover:bg-zinc-700 transition-colors"
          >
            <option value="" disabled>
              Add Track
            </option>
            <option value="sprite">Sprite Track</option>
            <option value="tween">Tween Track</option>
            <option value="event">Event Track</option>
          </select>
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
            <PlusIcon />
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div ref={timelineRef} className="flex-1 overflow-auto relative" onMouseDown={handleTimelineMouseDown}>
        {/* Time ruler */}
        <TimelineHeader
          duration={visibleDuration}
          animationDuration={totalDuration}
          pixelsPerSecond={timeline.zoom}
        />

        {/* Tracks */}
        <div className="relative">
          {selectedAnimation.tracks.length === 0 ? (
            <div className="p-4 text-xs text-zinc-500 text-center">
              No tracks yet. Add a track using the dropdown above.
            </div>
          ) : (
            selectedAnimation.tracks.map((track) => (
              <TimelineTrack
                key={track.id}
                track={track}
                pixelsPerSecond={timeline.zoom}
                animationDuration={totalDuration}
              />
            ))
          )}
        </div>

        {/* Playhead */}
        <Playhead
          currentTime={playback.currentTime}
          pixelsPerSecond={timeline.zoom}
          height={
            Math.max(selectedAnimation.tracks.length * 40, 100) + 30 // 30 for header
          }
        />
      </div>
    </div>
  );
}
