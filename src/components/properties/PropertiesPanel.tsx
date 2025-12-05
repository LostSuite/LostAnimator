import { useAnimator } from "../../context/AnimatorContext";
import { SpriteKeyProperties } from "./SpriteKeyProperties";
import { TweenKeyProperties } from "./TweenKeyProperties";
import { EventKeyProperties } from "./EventKeyProperties";
import type { SpriteKey, TweenKey, EventKey, TrackType } from "../../types";

export function PropertiesPanel() {
  const { selection, selectedAnimation } = useAnimator();

  // Find selected key and track type
  const { selectedKey, trackType } = (() => {
    if (selection.type !== "key" || !selectedAnimation) {
      return { selectedKey: null, trackType: null };
    }

    const track = selectedAnimation.tracks.find(
      (t) => t.id === selection.trackId
    );
    if (!track) return { selectedKey: null, trackType: null };

    const key = track.keys.find((k) => k.id === selection.keyId) ?? null;
    return { selectedKey: key, trackType: track.type as TrackType };
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="h-9 flex-shrink-0 px-3 flex items-center">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Properties</span>
      </div>

      <div className="px-3 pb-3 flex flex-col gap-3 overflow-y-auto min-h-0">
        {/* Key properties - use track type to determine which component */}
        {selectedKey && trackType === "sprite" && (
          <SpriteKeyProperties keyData={selectedKey as SpriteKey} />
        )}
        {selectedKey && trackType === "tween" && (
          <TweenKeyProperties keyData={selectedKey as TweenKey} />
        )}
        {selectedKey && trackType === "event" && (
          <EventKeyProperties keyData={selectedKey as EventKey} />
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
