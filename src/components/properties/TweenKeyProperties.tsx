import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAnimator } from "../../context/AnimatorContext";
import { DragNumberInput } from "../ui/DragNumberInput";
import type { TweenKey, EasingType } from "../../types";

interface TweenKeyPropertiesProps {
  keyData: TweenKey;
}

const EASING_OPTIONS: { value: EasingType; label: string }[] = [
  { value: "Linear", label: "Linear" },
  { value: "EaseIn", label: "Ease In" },
  { value: "EaseOut", label: "Ease Out" },
  { value: "EaseInOut", label: "Ease In Out" },
  { value: "BounceIn", label: "Bounce In" },
  { value: "BounceOut", label: "Bounce Out" },
];

function EasingDropdown({
  value,
  onChange,
}: {
  value: EasingType;
  onChange: (value: EasingType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = EASING_OPTIONS.find((opt) => opt.value === value) ?? EASING_OPTIONS[0];

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
      <span className="text-[10px] text-zinc-500 uppercase">Easing</span>
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
            {EASING_OPTIONS.map((option) => (
              <button
                key={option.value}
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

export function TweenKeyProperties({ keyData }: TweenKeyPropertiesProps) {
  const { selection, updateKey } = useAnimator();

  if (selection.type !== "key") return null;

  const handleUpdate = (updates: Partial<TweenKey>) => {
    updateKey(selection.trackId, keyData.id, updates);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Name</span>
        <input
          type="text"
          value={keyData.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="bg-zinc-700 rounded px-2 py-1 text-sm"
          placeholder="tween_name"
        />
      </label>

      <DragNumberInput
        value={keyData.time}
        onChange={(time) => handleUpdate({ time })}
        onInput={(time) => handleUpdate({ time })}
        min={0}
        dragSpeed={0.01}
        precision={2}
        label="Time"
      />

      <DragNumberInput
        value={keyData.duration}
        onChange={(duration) => handleUpdate({ duration: Math.max(0.01, duration) })}
        onInput={(duration) => handleUpdate({ duration: Math.max(0.01, duration) })}
        min={0.01}
        dragSpeed={0.01}
        precision={2}
        label="Duration"
      />

      <EasingDropdown
        value={keyData.easing}
        onChange={(easing) => handleUpdate({ easing })}
      />
    </div>
  );
}
