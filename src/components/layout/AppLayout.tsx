import { useAnimator } from "../../context/AnimatorContext";
import { AnimationList } from "../animation-list/AnimationList";
import { SpritePreview } from "../preview/SpritePreview";
import { SpritesheetList, SpritesheetModal } from "../spritesheet";
import { Timeline } from "../timeline/Timeline";
import { PropertiesPanel } from "../properties/PropertiesPanel";

export function AppLayout() {
  const { selectedAnimation, selectedSpritesheetId, selectSpritesheet } = useAnimator();

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100 select-none">
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left panel - Animations only */}
        <div className="w-52 flex-shrink-0 border-r border-zinc-700/50 flex flex-col bg-zinc-800/30">
          <AnimationList />
        </div>

        {/* Center panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Preview area - full width */}
          <div className="h-48 flex-shrink-0 border-b border-zinc-700/50 flex flex-col overflow-hidden">
            <SpritePreview />
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-hidden min-h-0">
            {selectedAnimation ? (
              <Timeline />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                Select or create an animation to edit
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Spritesheet + Properties */}
        <div className="w-56 flex-shrink-0 border-l border-zinc-700/50 flex flex-col bg-zinc-800/30">
          {/* Spritesheet list - 50% height */}
          <div className="h-1/2 flex-shrink-0 border-b border-zinc-700/50 flex flex-col min-h-0">
            <SpritesheetList />
          </div>

          {/* Properties panel - 50% height */}
          <div className="h-1/2 overflow-hidden min-h-0">
            <PropertiesPanel />
          </div>
        </div>
      </div>

      {/* Spritesheet modal */}
      {selectedSpritesheetId && (
        <SpritesheetModal
          spritesheetId={selectedSpritesheetId}
          onClose={() => selectSpritesheet(null)}
        />
      )}
    </div>
  );
}
