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
      {/* Key properties - use track type to determine which component */}
      {selectedKey && trackType === "sprite" && (
        <SpriteKeyProperties keyData={selectedKey as SpriteKey} />
      )}
      {selectedKey && trackType === "tween" && (
        <div className="flex flex-col h-full min-h-0">
          <div className="h-9 flex-shrink-0 px-3 flex items-center border-b border-zinc-700/50">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Properties</span>
          </div>
          <div className="flex-shrink-0 p-3">
            <TweenKeyProperties keyData={selectedKey as TweenKey} />
          </div>
        </div>
      )}
      {selectedKey && trackType === "event" && (
        <div className="flex flex-col h-full min-h-0">
          <div className="h-9 flex-shrink-0 px-3 flex items-center border-b border-zinc-700/50">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Properties</span>
          </div>
          <div className="flex-shrink-0 p-3">
            <EventKeyProperties keyData={selectedKey as EventKey} />
          </div>
        </div>
      )}

      {/* No key selected */}
      {!selectedKey && (
        <div className="flex flex-col h-full">
          <div className="h-9 flex-shrink-0 px-3 flex items-center border-b border-zinc-700/50">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Properties</span>
          </div>
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-500">
            Select a keyframe
          </div>
        </div>
      )}
    </div>
  );
}
