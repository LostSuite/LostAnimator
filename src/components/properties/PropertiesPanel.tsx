import { useAnimator } from "../../context/AnimatorContext";
import { SpriteKeyProperties } from "./SpriteKeyProperties";
import { TweenKeyProperties } from "./TweenKeyProperties";
import { EventKeyProperties } from "./EventKeyProperties";

export function PropertiesPanel() {
  const { selection, selectedAnimation } = useAnimator();

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

        {/* No key selected */}
        {!selectedKey && (
          <div className="text-xs text-zinc-500 text-center py-4">
            Select a keyframe to view properties
          </div>
        )}
      </div>
    </div>
  );
}
