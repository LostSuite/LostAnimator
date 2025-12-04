import { useAnimator } from "../../context/AnimatorContext";
import { TimelineKey } from "./TimelineKey";
import type { Track } from "../../types";

interface TimelineTrackProps {
  track: Track;
  pixelsPerSecond: number;
  animationDuration: number;
  snapToGrid: boolean;
  gridSize: number;
  onTrackContextMenu: (e: React.MouseEvent, trackId: string, trackType: Track["type"]) => void;
  onKeyContextMenu: (e: React.MouseEvent, trackId: string, keyId: string, keyType: "sprite" | "tween" | "event") => void;
  onKeyDoubleClick: (trackId: string, keyId: string, keyType: "sprite" | "tween" | "event") => void;
}

export function TimelineTrack({
  track,
  pixelsPerSecond,
  animationDuration,
  snapToGrid,
  gridSize,
  onTrackContextMenu,
  onKeyContextMenu,
  onKeyDoubleClick,
}: TimelineTrackProps) {
  const { removeTrack } = useAnimator();
  const animationWidth = animationDuration * pixelsPerSecond;

  const trackTypeLabel = {
    sprite: "Sprite",
    tween: "Tween",
    event: "Event",
  }[track.type];

  const trackColor = {
    sprite: "bg-blue-500/20 border-blue-500/50",
    tween: "bg-green-500/20 border-green-500/50",
    event: "bg-amber-500/20 border-amber-500/50",
  }[track.type];

  const handleContextMenu = (e: React.MouseEvent) => {
    onTrackContextMenu(e, track.id, track.type);
  };

  return (
    <div className="flex h-10 border-b border-zinc-700">
      {/* Track label */}
      <div className="w-[100px] flex-shrink-0 bg-zinc-800 flex items-center px-2 gap-1 border-r border-zinc-700">
        <span className="text-xs flex-1 truncate">{trackTypeLabel}</span>
        <button
          onClick={() => removeTrack(track.id)}
          className="text-xs text-zinc-500 hover:text-red-400"
          title="Delete track"
        >
          ×
        </button>
      </div>

      {/* Track content */}
      <div
        className={`flex-1 relative ${trackColor} border-l-2`}
        onContextMenu={handleContextMenu}
      >
        {/* Past animation area overlay (darker) */}
        <div
          className="absolute inset-y-0 bg-zinc-900/40 pointer-events-none"
          style={{ left: animationWidth, right: 0 }}
        />
        {/* Animation end marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-zinc-500/50 pointer-events-none"
          style={{ left: animationWidth }}
        />
        {track.keys.map((key) => (
          <TimelineKey
            key={key.id}
            trackId={track.id}
            keyData={key}
            pixelsPerSecond={pixelsPerSecond}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onContextMenu={onKeyContextMenu}
            onDoubleClick={onKeyDoubleClick}
          />
        ))}
      </div>
    </div>
  );
}
