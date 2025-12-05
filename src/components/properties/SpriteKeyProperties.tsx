import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAnimator } from "../../context/AnimatorContext";
import { DragNumberInput } from "../ui/DragNumberInput";
import { CoordinateInput } from "../ui/CoordinateInput";
import type { SpriteKey } from "../../types";

type FlipValue = "horizontal" | "vertical" | "both" | undefined;

const flipOptions: { value: FlipValue; label: string }[] = [
  { value: undefined, label: "None" },
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "both", label: "Both" },
];

function FlipDropdown({
  value,
  onChange,
}: {
  value: FlipValue;
  onChange: (value: FlipValue) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = flipOptions.find((opt) => opt.value === value) ?? flipOptions[0];

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-zinc-500 uppercase">Flip</span>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 text-xs text-left bg-zinc-700/50 border border-zinc-600/50 rounded hover:border-zinc-500 flex items-center justify-between"
      >
        <span className="text-zinc-300">{selectedOption.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-50 bg-zinc-800 border border-zinc-600 rounded shadow-lg py-1 max-h-48 overflow-y-auto"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {flipOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2 py-1 text-xs text-left hover:bg-zinc-700 ${
                  option.value === value ? "text-blue-400" : "text-zinc-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

interface SpriteKeyPropertiesProps {
  keyData: SpriteKey;
}

export function SpriteKeyProperties({ keyData }: SpriteKeyPropertiesProps) {
  const { selection, updateKey, spritesheets, spritesheetImages } = useAnimator();

  if (selection.type !== "key") return null;

  const handleUpdate = (updates: Partial<SpriteKey>) => {
    updateKey(selection.trackId, keyData.id, updates);
  };

  // Get the current spritesheet for this key
  const currentSpritesheetId = keyData.spritesheetId ?? spritesheets[0]?.id;
  const currentSpritesheet = spritesheets.find((s) => s.id === currentSpritesheetId);
  const currentImage = currentSpritesheetId ? spritesheetImages.get(currentSpritesheetId) : undefined;

  // Compute columns/rows from image dimensions
  const maxFrameX = currentSpritesheet && currentImage
    ? Math.floor(currentImage.width / currentSpritesheet.tileWidth) - 1
    : 999;
  const maxFrameY = currentSpritesheet && currentImage
    ? Math.floor(currentImage.height / currentSpritesheet.tileHeight) - 1
    : 999;

  return (
    <div className="flex flex-col gap-3">
      <DragNumberInput
        value={keyData.time}
        onChange={(time) => handleUpdate({ time })}
        onInput={(time) => handleUpdate({ time })}
        min={0}
        dragSpeed={0.01}
        precision={2}
        label="Time"
      />

      <CoordinateInput
        label="Frame"
        x={keyData.frame[0]}
        y={keyData.frame[1]}
        onXChange={(x) => handleUpdate({ frame: [Math.round(x), keyData.frame[1]] })}
        onYChange={(y) => handleUpdate({ frame: [keyData.frame[0], Math.round(y)] })}
        min={0}
        maxX={maxFrameX}
        maxY={maxFrameY}
        dragSpeed={0.1}
        precision={0}
      />

      <CoordinateInput
        label="Offset"
        x={keyData.offset[0]}
        y={keyData.offset[1]}
        onXChange={(x) => handleUpdate({ offset: [x, keyData.offset[1]] })}
        onYChange={(y) => handleUpdate({ offset: [keyData.offset[0], y] })}
        dragSpeed={1}
        precision={0}
      />

      <FlipDropdown
        value={keyData.flip}
        onChange={(flip) => handleUpdate({ flip })}
      />
    </div>
  );
}
