import { useState } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import { SpritesheetListItem } from "./SpritesheetListItem";

const PlusIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface ContextMenuState {
  x: number;
  y: number;
  spritesheetId: string;
}

export function SpritesheetList() {
  const { spritesheets, addSpritesheet, removeSpritesheet, selectSpritesheet } =
    useAnimator();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = (e: React.MouseEvent, spritesheetId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, spritesheetId });
  };

  const handleDelete = () => {
    if (contextMenu) {
      removeSpritesheet(contextMenu.spritesheetId);
      setContextMenu(null);
    }
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div className="flex flex-col min-h-0" onClick={closeContextMenu}>
      {/* Header */}
      <div className="h-9 flex-shrink-0 px-3 flex items-center justify-between border-b border-zinc-700/50">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Spritesheets
        </span>
        <button
          onClick={() => addSpritesheet()}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
          title="Add spritesheet"
        >
          <PlusIcon />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {spritesheets.length === 0 ? (
          <div className="px-3 py-4 text-xs text-zinc-500 text-center">
            No spritesheets.
            <br />
            Click + to add one.
          </div>
        ) : (
          spritesheets.map((spritesheet) => (
            <SpritesheetListItem
              key={spritesheet.id}
              spritesheet={spritesheet}
              onDoubleClick={() => selectSpritesheet(spritesheet.id)}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 bg-zinc-800 border border-zinc-600 rounded shadow-lg py-1 min-w-32"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleDelete}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-700 text-red-400"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
