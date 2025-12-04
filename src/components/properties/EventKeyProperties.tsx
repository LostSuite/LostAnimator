import { useAnimator } from "../../context/AnimatorContext";
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
      <h4 className="text-xs text-zinc-400 uppercase">Event Key</h4>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Name</span>
        <input
          type="text"
          value={keyData.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="bg-zinc-700 rounded px-2 py-1 text-sm"
          placeholder="event_name"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Time (s)</span>
        <input
          type="number"
          step="0.01"
          value={keyData.time}
          onChange={(e) => handleUpdate({ time: parseFloat(e.target.value) || 0 })}
          className="bg-zinc-700 rounded px-2 py-1 text-sm"
        />
      </label>

      <p className="text-xs text-zinc-500">
        Events are instant triggers with no duration. Register handlers in your
        game code to respond to these events.
      </p>
    </div>
  );
}
