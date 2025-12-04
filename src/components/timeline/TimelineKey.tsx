import { useAnimator } from "../../context/AnimatorContext";
import { timeToPixel } from "../../utils/timelineUtils";
import type { Key } from "../../types";

interface TimelineKeyProps {
  trackId: string;
  keyData: Key;
  pixelsPerSecond: number;
  snapToGrid: boolean;
  gridSize: number;
  onContextMenu: (e: React.MouseEvent, trackId: string, keyId: string, keyType: "sprite" | "tween" | "event") => void;
  onDoubleClick: (trackId: string, keyId: string, keyType: "sprite" | "tween" | "event") => void;
}

export function TimelineKey({
  trackId,
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

  const left = timeToPixel(keyData.time, pixelsPerSecond);

  // Calculate width based on key type
  const isEvent = keyData.type === "event";
  const isSprite = keyData.type === "sprite";

  let width: number;
  if (isEvent || isSprite) {
    width = 12; // Event and sprite keys are small square markers
  } else if (keyData.type === "tween") {
    // Tween keys have their own duration
    width = timeToPixel(keyData.duration, pixelsPerSecond);
  } else {
    width = 12; // Fallback
  }

  // Whether this key type can be resized (only tween keys)
  const canResize = keyData.type === "tween";

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
    onContextMenu(e, trackId, keyData.id, keyData.type);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(trackId, keyData.id, keyData.type);
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
    if (!canResize) return; // Only tween keys can be resized
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
  }[keyData.type];

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
