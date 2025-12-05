import type React from "react";
import { useCallback, useEffect, useRef, useState, useLayoutEffect } from "react";

interface DragNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onInput?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  dragSpeed?: number;
  precision?: number;
  className?: string;
  label?: string;
  layout?: "vertical" | "horizontal";
  roundedLeft?: boolean;
}

export function DragNumberInput({
  value,
  onChange,
  onInput,
  min = -Infinity,
  max = Infinity,
  dragSpeed = 0.01,
  precision = 2,
  className = "",
  label,
  layout = "vertical",
  roundedLeft = true,
}: DragNumberInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState((value ?? 0).toFixed(precision));
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use refs for callbacks to avoid re-triggering the drag effect
  const onChangeRef = useRef(onChange);
  const onInputRef = useRef(onInput);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
    onInputRef.current = onInput;
  }, [onChange, onInput]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue((value ?? 0).toFixed(precision));
    }
  }, [value, precision, isEditing]);

  const clampValue = useCallback(
    (val: number) => Math.max(min, Math.min(max, val)),
    [min, max]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartValue(value ?? 0);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    let lastValue = value ?? 0;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const deltaValue = deltaX * dragSpeed;
      const newValue = clampValue(dragStartValue + deltaValue);
      lastValue = newValue;
      onInputRef.current?.(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (lastValue !== value) {
        onChangeRef.current(lastValue);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ew-resize";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isDragging, dragStartX, dragStartValue, dragSpeed, value, clampValue]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleFocus = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue);
    if (!Number.isNaN(parsed)) {
      onChange(clampValue(parsed));
    } else {
      setInputValue((value ?? 0).toFixed(precision));
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setInputValue((value ?? 0).toFixed(precision));
      setIsEditing(false);
    }
  };

  const isHorizontal = layout === "horizontal";

  return (
    <div className={`flex ${isHorizontal ? "items-center gap-2" : "flex-col gap-1"} ${className}`}>
      {label && (
        <span className="text-[10px] text-zinc-500 uppercase whitespace-nowrap">
          {label}
        </span>
      )}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="cursor-ew-resize"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={handleFocus}
          className={`${isHorizontal ? "w-16" : "w-full"} px-2 py-1 text-xs ${roundedLeft ? "rounded" : "rounded-r"} font-mono transition-colors ${
            isEditing
              ? "bg-zinc-700 text-zinc-100 border border-blue-500 outline-none"
              : "bg-zinc-700/50 text-zinc-300 border border-zinc-600/50 cursor-ew-resize hover:border-zinc-500 focus:border-blue-500 focus:outline-none"
          }`}
          readOnly={!isEditing}
        />
      </div>
    </div>
  );
}
