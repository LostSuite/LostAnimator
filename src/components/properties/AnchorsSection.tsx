import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CoordinateInput } from "../ui/CoordinateInput";
import type { Point } from "../../types";

const PlusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Anchor colors matching the preview
const ANCHOR_COLORS = [
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
];

interface SortableAnchorItemProps {
  name: string;
  color: string;
  isSelected: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

function SortableAnchorItem({
  name,
  color,
  isSelected,
  isRenaming,
  renameValue,
  renameInputRef,
  onSelect,
  onContextMenu,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: SortableAnchorItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-500/20 text-blue-300"
          : "text-zinc-300 hover:bg-zinc-700/50"
      }`}
      {...attributes}
      {...listeners}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          spellCheck={false}
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onBlur={onRenameSubmit}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameSubmit();
            if (e.key === "Escape") onRenameCancel();
          }}
          className="flex-1 px-1 py-0.5 text-xs bg-zinc-700 border border-blue-500 rounded text-zinc-200 outline-none"
        />
      ) : (
        <span className="text-xs truncate">{name}</span>
      )}
    </div>
  );
}

export interface AnchorsSectionProps {
  anchors: Record<string, Point>;
  onUpdate: (anchors: Record<string, Point>) => void;
}

export function AnchorsSection({ anchors, onUpdate }: AnchorsSectionProps) {
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; name: string } | null>(null);
  const [renamingAnchor, setRenamingAnchor] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const anchorEntries = Object.entries(anchors);
  const anchorNames = anchorEntries.map(([name]) => name);

  useEffect(() => {
    if (renamingAnchor && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingAnchor]);

  const handleContextMenu = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, name });
  };

  const handleRename = () => {
    if (!contextMenu) return;
    setRenamingAnchor(contextMenu.name);
    setRenameValue(contextMenu.name);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    const { [contextMenu.name]: _, ...rest } = anchors;
    onUpdate(rest);
    if (selectedAnchor === contextMenu.name) setSelectedAnchor(null);
    setContextMenu(null);
  };

  const submitRename = () => {
    if (!renamingAnchor) return;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== renamingAnchor && !(trimmed in anchors)) {
      const { [renamingAnchor]: pos, ...rest } = anchors;
      onUpdate({ ...rest, [trimmed]: pos });
      if (selectedAnchor === renamingAnchor) setSelectedAnchor(trimmed);
    }
    setRenamingAnchor(null);
  };

  const handleAdd = () => {
    let i = 1;
    let name = `anchor_${i}`;
    while (name in anchors) {
      i++;
      name = `anchor_${i}`;
    }
    onUpdate({ ...anchors, [name]: { x: 0, y: 0 } });
    setSelectedAnchor(name);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = anchorNames.indexOf(active.id as string);
    const newIndex = anchorNames.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the anchor names
    const reorderedNames = [...anchorNames];
    const [movedName] = reorderedNames.splice(oldIndex, 1);
    reorderedNames.splice(newIndex, 0, movedName);

    // Rebuild the anchors object in new order
    const newAnchors: Record<string, Point> = {};
    for (const name of reorderedNames) {
      newAnchors[name] = anchors[name];
    }
    onUpdate(newAnchors);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 border-t border-zinc-700/50">
      {/* Header */}
      <div className="h-8 flex-shrink-0 flex items-center justify-between px-3 border-b border-zinc-700/50">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Anchors</span>
        <button
          onClick={handleAdd}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
          title="Add anchor"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Anchor list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {anchorEntries.length === 0 ? (
          <div className="p-3 text-xs text-zinc-500 italic">No anchors</div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={anchorNames}
                strategy={verticalListSortingStrategy}
              >
                <div className="py-1">
                  {anchorEntries.map(([name], index) => {
                    const color = ANCHOR_COLORS[index % ANCHOR_COLORS.length];
                    const isSelected = selectedAnchor === name;
                    const isRenaming = renamingAnchor === name;

                    return (
                      <SortableAnchorItem
                        key={name}
                        name={name}
                        color={color}
                        isSelected={isSelected}
                        isRenaming={isRenaming}
                        renameValue={renameValue}
                        renameInputRef={renameInputRef}
                        onSelect={() => setSelectedAnchor(isSelected ? null : name)}
                        onContextMenu={(e) => handleContextMenu(e, name)}
                        onRenameChange={setRenameValue}
                        onRenameSubmit={submitRename}
                        onRenameCancel={() => setRenamingAnchor(null)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
            {/* Position editor below list */}
            {selectedAnchor && anchors[selectedAnchor] && (
              <div className="px-3 py-2 border-t border-zinc-700/50">
                <CoordinateInput
                  label="Position"
                  x={anchors[selectedAnchor].x}
                  y={anchors[selectedAnchor].y}
                  onXChange={(x) => onUpdate({ ...anchors, [selectedAnchor]: { x, y: anchors[selectedAnchor].y } })}
                  onYChange={(y) => onUpdate({ ...anchors, [selectedAnchor]: { x: anchors[selectedAnchor].x, y } })}
                  dragSpeed={1}
                  precision={0}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Context menu */}
      {contextMenu &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <div
              className="fixed z-50 bg-zinc-800 border border-zinc-600 rounded shadow-lg py-1 min-w-24"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                onClick={handleRename}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-700 text-zinc-200"
              >
                Rename
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-700 text-red-400"
              >
                Delete
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
