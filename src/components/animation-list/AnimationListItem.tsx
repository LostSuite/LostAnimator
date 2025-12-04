import { useState, useEffect, useRef } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import type { Animation } from "../../types";

// SVG Drag Handle Icon
const DragHandleIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-40">
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="9" cy="18" r="2" />
    <circle cx="15" cy="18" r="2" />
  </svg>
);

interface AnimationListItemProps {
  animation: Animation;
  index: number;
  isEditing: boolean;
  isDragOver: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
  onEditComplete: (newName: string) => void;
  onEditCancel: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function AnimationListItem({
  animation,
  isEditing,
  isDragOver,
  onContextMenu,
  onEditComplete,
  onEditCancel,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: AnimationListItemProps) {
  const { selectedAnimationId, selectAnimation } = useAnimator();
  const [editName, setEditName] = useState(animation.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedAnimationId === animation.id;

  useEffect(() => {
    if (isEditing) {
      setEditName(animation.name);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, animation.name]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onEditComplete(editName);
    } else if (e.key === "Escape") {
      onEditCancel();
    }
  };

  return (
    <div
      draggable={!isEditing}
      className={`flex items-center px-1 py-1 rounded cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-600/30 text-zinc-100"
          : "text-zinc-300 hover:bg-zinc-700/50"
      } ${isDragOver ? "border-t-2 border-blue-500" : ""}`}
      onClick={() => !isEditing && selectAnimation(animation.id)}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="flex-shrink-0 cursor-grab active:cursor-grabbing px-1">
        <DragHandleIcon />
      </div>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={() => onEditComplete(editName)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-zinc-700 px-1.5 py-0.5 text-xs rounded outline-none border border-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-xs truncate px-1">{animation.name}</span>
      )}
    </div>
  );
}
