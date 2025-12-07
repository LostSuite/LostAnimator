import { useAnimator } from "../../context/AnimatorContext";
import { DragNumberInput } from "../ui/DragNumberInput";
import { AnchorsSection } from "./AnchorsSection";
import type { EventKey } from "../../types";

interface EventKeyPropertiesProps {
  keyData: EventKey;
}

export function EventKeyProperties({ keyData }: EventKeyPropertiesProps) {
  const { selection, updateKey } = useAnimator();

  if (selection.type !== "key") return null;

  const handleUpdate = (updates: Partial<EventKey>) => {
    updateKey(selection.trackId, keyData.id, updates);
  };

  return (
    <>
      {/* Key properties */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <DragNumberInput
          value={keyData.time}
          onChange={(time) => handleUpdate({ time })}
          onInput={(time) => handleUpdate({ time })}
          min={0}
          dragSpeed={0.01}
          precision={2}
          label="Time"
        />

        <p className="text-xs text-zinc-500">
          Events are instant triggers with no duration. Register handlers in your
          game code to respond to these events.
        </p>
      </div>

      {/* Anchors section - fills remaining space */}
      <div className="mt-3 -mx-3 flex-1 flex flex-col min-h-0">
        <AnchorsSection
          anchors={keyData.anchors}
          onUpdate={(anchors) => handleUpdate({ anchors })}
        />
      </div>
    </>
  );
}
