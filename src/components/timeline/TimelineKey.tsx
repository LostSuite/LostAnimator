import { useAnimator } from "../../context/AnimatorContext";
import { timeToPixel } from "../../utils/timelineUtils";
import type { Key, TrackType } from "../../types";

interface TimelineKeyProps {
  trackId: string;
  trackType: TrackType;
  keyData: Key;
  pixelsPerSecond: number;
  snapToGrid: boolean;
  gridSize: number;
  onContextMenu: (e: React.MouseEvent, trackId: string, keyId: string, keyType: TrackType) => void;
  onDoubleClick: (trackId: string, keyId: string, keyType: TrackType) => void;
}

export function TimelineKey({
  trackId,
  trackType,
  keyData,
  pixelsPerSecond,
  snapToGrid,
  gridSize,
  onContextMenu,
  onDoubleClick,
}: TimelineKeyProps) {
  const { selection, setSelection, startBatch, endBatch, updateKey } = useAnimator();

  const isSelected =
    selection.type === "key" &&
    selection.trackId === trackId &&
    selection.keyId === keyData.id;

  const timePosition = timeToPixel(keyData.time, pixelsPerSecond);

  // Calculate width based on track type
  const isEvent = trackType === "event";
  const isSprite = trackType === "sprite";
  const isTween = trackType === "tween";

  let width: number;
  if (isEvent || isSprite) {
    width = 12; // Event and sprite keys are small square markers
  } else if (isTween && "duration" in keyData) {
    // Tween keys have their own duration
    width = timeToPixel(keyData.duration, pixelsPerSecond);
  } else {
    width = 12; // Fallback
  }

  // Center event/sprite markers on their trigger time, tween keys start at their time
  const left = (isEvent || isSprite) ? timePosition - width / 2 : timePosition;

  // Whether this key type can be resized (only tween keys)
  const canResize = isTween;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection({
      type: "key",
      animationId: "", // Will be set from context
      trackId,
      keyId: keyData.id,
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    onContextMenu(e, trackId, keyData.id, trackType);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(trackId, keyData.id, trackType);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    startBatch();

    const startX = e.clientX;
    const startTime = keyData.time;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      let newTime = Math.max(0, startTime + deltaTime);

      // Apply snapping if enabled
      if (snapToGrid && gridSize > 0) {
        newTime = Math.round(newTime / gridSize) * gridSize;
      }

      updateKey(trackId, keyData.id, { time: newTime });
    };

    const handleMouseUp = () => {
      endBatch();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeEnd = (e: React.MouseEvent) => {
    if (!canResize || !("duration" in keyData)) return; // Only tween keys can be resized
    e.preventDefault();
    e.stopPropagation();
    startBatch();

    const startX = e.clientX;
    const startDuration = keyData.duration;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaDuration = deltaX / pixelsPerSecond;
      let newDuration = Math.max(0.05, startDuration + deltaDuration);

      // Apply snapping if enabled
      if (snapToGrid && gridSize > 0) {
        newDuration = Math.max(gridSize, Math.round(newDuration / gridSize) * gridSize);
      }

      updateKey(trackId, keyData.id, { duration: newDuration });
    };

    const handleMouseUp = () => {
      endBatch();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const keyColor = {
    sprite: "bg-blue-500",
    tween: "bg-green-500",
    event: "bg-amber-500",
  }[trackType];

  return (
    <div
      className={`absolute top-1 bottom-1 rounded cursor-pointer ${keyColor} ${
        isSelected ? "ring-2 ring-white" : ""
      }`}
      style={{
        left,
        width: Math.max(width, 4),
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleDragStart}
      onContextMenu={handleContextMenu}
    >
      {/* Resize handle for tween keys only */}
      {canResize && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
          onMouseDown={handleResizeEnd}
        />
      )}

      {/* Event marker diamond */}
      {isEvent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-amber-400 rotate-45" />
        </div>
      )}
    </div>
  );
}
