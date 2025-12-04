import { useAnimator } from "../../context/AnimatorContext";
import { DragNumberInput } from "../ui/DragNumberInput";
import type { SpriteKey } from "../../types";

interface SpriteKeyPropertiesProps {
  keyData: SpriteKey;
}

export function SpriteKeyProperties({ keyData }: SpriteKeyPropertiesProps) {
  const { selection, updateKey, spritesheets, spritesheetImages } = useAnimator();

  if (selection.type !== "key") return null;

  const handleUpdate = (updates: Partial<SpriteKey>) => {
    updateKey(selection.trackId, keyData.id, updates);
  };

  // Get the current spritesheet for this key
  const currentSpritesheetId = keyData.spritesheetId ?? spritesheets[0]?.id;
  const currentSpritesheet = spritesheets.find((s) => s.id === currentSpritesheetId);
  const currentImage = currentSpritesheetId ? spritesheetImages.get(currentSpritesheetId) : undefined;

  // Compute columns/rows from image dimensions
  const maxFrameX = currentSpritesheet && currentImage
    ? Math.floor(currentImage.width / currentSpritesheet.tileWidth) - 1
    : 999;
  const maxFrameY = currentSpritesheet && currentImage
    ? Math.floor(currentImage.height / currentSpritesheet.tileHeight) - 1
    : 999;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs text-zinc-400 uppercase">Sprite Key</h4>

      {/* Spritesheet selector - only show if multiple spritesheets */}
      {spritesheets.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">Spritesheet</span>
          <select
            value={currentSpritesheetId ?? ""}
            onChange={(e) => handleUpdate({ spritesheetId: e.target.value })}
            className="bg-zinc-700 rounded px-2 py-1 text-sm"
          >
            {spritesheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <DragNumberInput
        value={keyData.time}
        onChange={(time) => handleUpdate({ time })}
        onInput={(time) => handleUpdate({ time })}
        min={0}
        dragSpeed={0.01}
        precision={2}
        label="Time"
      />

      <div className="grid grid-cols-2 gap-2">
        <DragNumberInput
          value={keyData.frame[0]}
          onChange={(x) => handleUpdate({ frame: [x, keyData.frame[1]] })}
          onInput={(x) => handleUpdate({ frame: [x, keyData.frame[1]] })}
          min={0}
          max={maxFrameX}
          dragSpeed={0.1}
          precision={0}
          label="Frame X"
        />
        <DragNumberInput
          value={keyData.frame[1]}
          onChange={(y) => handleUpdate({ frame: [keyData.frame[0], y] })}
          onInput={(y) => handleUpdate({ frame: [keyData.frame[0], y] })}
          min={0}
          max={maxFrameY}
          dragSpeed={0.1}
          precision={0}
          label="Frame Y"
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Flip</span>
        <select
          value={keyData.flip || ""}
          onChange={(e) =>
            handleUpdate({
              flip: e.target.value
                ? (e.target.value as "horizontal" | "vertical" | "both")
                : undefined,
            })
          }
          className="bg-zinc-700 rounded px-2 py-1 text-sm"
        >
          <option value="">None</option>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
          <option value="both">Both</option>
        </select>
      </label>
    </div>
  );
}
