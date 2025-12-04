import { useAnimator } from "../../context/AnimatorContext";
import { DragNumberInput } from "../ui/DragNumberInput";
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
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Event</span>
        <input
          type="text"
          value={keyData.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="bg-zinc-700 rounded px-2 py-1 text-sm"
          placeholder="event_name"
        />
      </label>

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
  );
}
