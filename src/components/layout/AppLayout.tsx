import { useState, useCallback, useRef } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import { AnimationList } from "../animation-list/AnimationList";
import { SpritePreview } from "../preview/SpritePreview";
import { SpritesheetList, SpritesheetModal } from "../spritesheet";
import { Timeline } from "../timeline/Timeline";
import { PropertiesPanel } from "../properties/PropertiesPanel";
import { BrokenReferencesModal } from "../modals/BrokenReferencesModal";

export function AppLayout() {
  const {
    selectedAnimation,
    selectedSpritesheetId,
    selectSpritesheet,
    brokenReferences,
    relocateSpritesheet,
    clearBrokenReferences,
  } = useAnimator();
  const [previewHeight, setPreviewHeight] = useState(192); // Default h-48 = 192px
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = previewHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(100, Math.min(500, startHeight + deltaY));
      setPreviewHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [previewHeight]);

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100 select-none">
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left panel - Animations only */}
        <div className="w-52 flex-shrink-0 border-r border-zinc-700/50 flex flex-col bg-zinc-800/30">
          <AnimationList />
        </div>

        {/* Center panel */}
        <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Preview area - resizable */}
          <div
            className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{ height: previewHeight }}
          >
            <SpritePreview />
          </div>

          {/* Resize handle */}
          <div
            className="h-1 flex-shrink-0 bg-zinc-700/50 hover:bg-blue-500/50 cursor-ns-resize transition-colors"
            onMouseDown={handleResizeStart}
          />

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

      {/* Broken references modal */}
      {brokenReferences.length > 0 && (
        <BrokenReferencesModal
          brokenReferences={brokenReferences}
          onRelocate={relocateSpritesheet}
          onClose={clearBrokenReferences}
        />
      )}
    </div>
  );
}
