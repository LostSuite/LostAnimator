import { generateRulerTicks } from "../../utils/timelineUtils";

interface TimelineHeaderProps {
  duration: number;
  animationDuration: number;
  pixelsPerSecond: number;
}

export function TimelineHeader({ duration, animationDuration, pixelsPerSecond }: TimelineHeaderProps) {
  const ticks = generateRulerTicks(duration, pixelsPerSecond);
  const animationWidth = animationDuration * pixelsPerSecond;

  return (
    <div className="h-8 border-b border-zinc-700 flex">
      {/* Track label column */}
      <div className="w-[100px] flex-shrink-0 bg-zinc-800" />

      {/* Time ruler */}
      <div
        className="relative"
        style={{ width: duration * pixelsPerSecond }}
      >
        {/* Active animation area */}
        <div
          className="absolute inset-y-0 left-0 bg-zinc-800"
          style={{ width: animationWidth }}
        />
        {/* Past animation area (darker) */}
        <div
          className="absolute inset-y-0 bg-zinc-900/50"
          style={{ left: animationWidth, right: 0 }}
        />
        {/* Ticks */}
        {ticks.map((tick, i) => (
          <div
            key={i}
            className="absolute top-0"
            style={{ left: tick.position }}
          >
            <div
              className={`w-px ${tick.isMajor ? "h-4 bg-zinc-500" : "h-2 bg-zinc-600"}`}
            />
            {tick.isMajor && (
              <span className="absolute top-4 left-1 text-[10px] text-zinc-500">
                {tick.time.toFixed(1)}s
              </span>
            )}
          </div>
        ))}
        {/* Animation end marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-zinc-500"
          style={{ left: animationWidth }}
        />
      </div>
    </div>
  );
}
