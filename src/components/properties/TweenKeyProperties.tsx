import { useAnimator } from "../../context/AnimatorContext";
import { DragNumberInput } from "../ui/DragNumberInput";
import type { TweenKey, EasingType } from "../../types";

interface TweenKeyPropertiesProps {
  keyData: TweenKey;
}

const EASING_OPTIONS: EasingType[] = [
  "Linear",
  "EaseIn",
  "EaseOut",
  "EaseInOut",
  "BounceIn",
  "BounceOut",
];

export function TweenKeyProperties({ keyData }: TweenKeyPropertiesProps) {
  const { selection, updateKey } = useAnimator();

  if (selection.type !== "key") return null;

  const handleUpdate = (updates: Partial<TweenKey>) => {
    updateKey(selection.trackId, keyData.id, updates);
  };

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs text-zinc-400 uppercase">Tween Key</h4>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Name</span>
        <input
          type="text"
          value={keyData.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="bg-zinc-700 rounded px-2 py-1 text-sm"
          placeholder="tween_name"
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

      <DragNumberInput
        value={keyData.duration}
        onChange={(duration) => handleUpdate({ duration: Math.max(0.01, duration) })}
        onInput={(duration) => handleUpdate({ duration: Math.max(0.01, duration) })}
        min={0.01}
        dragSpeed={0.01}
        precision={2}
        label="Duration"
      />

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Easing</span>
        <select
          value={keyData.easing}
          onChange={(e) => handleUpdate({ easing: e.target.value as EasingType })}
          className="bg-zinc-700 rounded px-2 py-1 text-sm"
        >
          {EASING_OPTIONS.map((easing) => (
            <option key={easing} value={easing}>
              {easing}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
