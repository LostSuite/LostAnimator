import { useAnimator } from "../../context/AnimatorContext";
import { SpriteKeyProperties } from "./SpriteKeyProperties";
import { TweenKeyProperties } from "./TweenKeyProperties";
import { EventKeyProperties } from "./EventKeyProperties";

export function PropertiesPanel() {
  const { selection, selectedAnimation, updateAnimation } = useAnimator();

  // Find selected key
  const selectedKey = (() => {
    if (selection.type !== "key" || !selectedAnimation) return null;

    const track = selectedAnimation.tracks.find(
      (t) => t.id === selection.trackId
    );
    if (!track) return null;

    return track.keys.find((k) => k.id === selection.keyId) ?? null;
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="h-9 flex-shrink-0 px-3 flex items-center">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Properties</span>
      </div>

      <div className="px-3 pb-3 flex flex-col gap-3 overflow-y-auto min-h-0">
        {/* Animation properties */}
        {selection.type === "animation" && selectedAnimation && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 uppercase">Name</span>
              <input
                type="text"
                value={selectedAnimation.name}
                onChange={(e) =>
                  updateAnimation(selectedAnimation.id, { name: e.target.value })
                }
                className="bg-zinc-700/50 border border-zinc-600/50 rounded px-2 py-1 text-xs"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedAnimation.loop}
                onChange={(e) =>
                  updateAnimation(selectedAnimation.id, { loop: e.target.checked })
                }
                className="rounded bg-zinc-700/50 border-zinc-600"
              />
              <span className="text-xs text-zinc-300">Loop</span>
            </label>
          </div>
        )}

        {/* Key properties */}
        {selectedKey?.type === "sprite" && (
          <SpriteKeyProperties keyData={selectedKey} />
        )}
        {selectedKey?.type === "tween" && (
          <TweenKeyProperties keyData={selectedKey} />
        )}
        {selectedKey?.type === "event" && (
          <EventKeyProperties keyData={selectedKey} />
        )}

        {/* No selection */}
        {selection.type === "none" && (
          <div className="text-xs text-zinc-500 text-center py-4">
            Select an animation or key to view properties
          </div>
        )}
      </div>
    </div>
  );
}
