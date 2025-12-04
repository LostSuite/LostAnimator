import { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAnimator } from "../../context/AnimatorContext";
import type { Animation } from "../../types";

interface AnimationListItemProps {
  animation: Animation;
  isEditing: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
  onEditComplete: (newName: string) => void;
  onEditCancel: () => void;
}

export function AnimationListItem({
  animation,
  isEditing,
  onContextMenu,
  onEditComplete,
  onEditCancel,
}: AnimationListItemProps) {
  const { selectedAnimationId, selectAnimation } = useAnimator();
  const [editName, setEditName] = useState(animation.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: animation.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
      ref={setNodeRef}
      style={style}
      className={`flex items-center px-2 py-1 rounded cursor-grab active:cursor-grabbing transition-colors ${
        isSelected
          ? "bg-blue-600/30 text-zinc-100"
          : "text-zinc-300 hover:bg-zinc-700/50"
      }`}
      onClick={() => !isEditing && selectAnimation(animation.id)}
      onContextMenu={onContextMenu}
      {...attributes}
      {...listeners}
    >
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
        <span className="flex-1 text-xs truncate">{animation.name}</span>
      )}
    </div>
  );
}
