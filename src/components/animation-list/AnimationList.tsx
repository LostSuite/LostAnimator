import { useState, useRef, useEffect } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import { AnimationListItem } from "./AnimationListItem";

// SVG Plus Icon
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface ContextMenuState {
  x: number;
  y: number;
  animationId: string;
}

export function AnimationList() {
  const { animations, addAnimation, removeAnimation, updateAnimation, reorderAnimations } = useAnimator();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, animationId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, animationId });
  };

  const handleRename = () => {
    if (contextMenu) {
      setEditingId(contextMenu.animationId);
      setContextMenu(null);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      removeAnimation(contextMenu.animationId);
      setContextMenu(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(fromIndex)) {
      reorderAnimations(fromIndex, toIndex);
    }
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="h-9 flex-shrink-0 px-3 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Animations</span>
        <button
          onClick={addAnimation}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded transition-colors"
          title="Add Animation"
        >
          <PlusIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {animations.length === 0 ? (
          <div className="p-3 text-xs text-zinc-500 text-center">
            No animations yet
          </div>
        ) : (
          <div className="px-1 pb-1">
            {animations.map((animation, index) => (
              <AnimationListItem
                key={animation.id}
                animation={animation}
                index={index}
                isEditing={editingId === animation.id}
                isDragOver={dragOverIndex === index}
                onContextMenu={(e) => handleContextMenu(e, animation.id)}
                onEditComplete={(newName) => {
                  if (newName.trim()) {
                    updateAnimation(animation.id, { name: newName.trim() });
                  }
                  setEditingId(null);
                }}
                onEditCancel={() => setEditingId(null)}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed bg-zinc-800 border border-zinc-600 rounded shadow-lg py-1 z-50 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleRename}
            className="w-full px-3 py-1.5 text-xs text-left text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-3 py-1.5 text-xs text-left text-red-400 hover:bg-zinc-700 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
