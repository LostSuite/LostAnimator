import { timeToPixel } from "../../utils/timelineUtils";

interface PlayheadProps {
  currentTime: number;
  pixelsPerSecond: number;
  height: number;
}

export function Playhead({ currentTime, pixelsPerSecond, height }: PlayheadProps) {
  const left = timeToPixel(currentTime, pixelsPerSecond) + 100; // 100px offset for track labels

  return (
    <div
      className="absolute top-0 w-px bg-red-500 pointer-events-none z-10"
      style={{
        left,
        height,
      }}
    >
      {/* Playhead handle */}
      <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
    </div>
  );
}
