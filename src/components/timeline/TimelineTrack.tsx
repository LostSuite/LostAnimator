import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimelineKey } from "./TimelineKey";
import type { Track } from "../../types";

interface TimelineTrackProps {
  track: Track;
  pixelsPerSecond: number;
  animationDuration: number;
  snapToGrid: boolean;
  gridSize: number;
  isRenaming: boolean;
  onRenameSubmit: (trackId: string, newName: string) => void;
  onRenameCancel: () => void;
  onTrackContextMenu: (e: React.MouseEvent, trackId: string, trackType: Track["type"]) => void;
  onTrackLabelContextMenu: (e: React.MouseEvent, trackId: string) => void;
  onKeyContextMenu: (e: React.MouseEvent, trackId: string, keyId: string, keyType: "sprite" | "tween" | "event") => void;
  onKeyDoubleClick: (trackId: string, keyId: string, keyType: "sprite" | "tween" | "event") => void;
}

export function TimelineTrack({
  track,
  pixelsPerSecond,
  animationDuration,
  snapToGrid,
  gridSize,
  isRenaming,
  onRenameSubmit,
  onRenameCancel,
  onTrackContextMenu,
  onTrackLabelContextMenu,
  onKeyContextMenu,
  onKeyDoubleClick,
}: TimelineTrackProps) {
  const [renameValue, setRenameValue] = useState(track.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id, disabled: isRenaming });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // Focus and select text when rename mode starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      setRenameValue(track.name);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming, track.name]);

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onRenameSubmit(track.id, renameValue);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onRenameCancel();
    }
  };

  const handleRenameBlur = () => {
    onRenameSubmit(track.id, renameValue);
  };
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

  const handleLabelContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onTrackLabelContextMenu(e, track.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex h-10 border-b border-zinc-700"
    >
      {/* Track label */}
      <div
        className="w-[140px] flex-shrink-0 bg-zinc-800 flex items-center px-2 border-r border-zinc-700 cursor-grab active:cursor-grabbing"
        onContextMenu={handleLabelContextMenu}
        {...attributes}
        {...listeners}
      >
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            spellCheck={false}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            className="w-full text-xs bg-zinc-700 border border-zinc-500 rounded px-1 py-0.5 outline-none focus:border-blue-500"
          />
        ) : (
          <span className="text-xs truncate">{track.name || trackTypeLabel}</span>
        )}
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
            trackType={track.type}
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
