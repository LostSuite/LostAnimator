import { DragNumberInput } from "./DragNumberInput";

export interface CoordinateInputProps {
  label?: string;
  x: number;
  y: number;
  onXChange: (newX: number) => void;
  onYChange: (newY: number) => void;
  min?: number;
  max?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  dragSpeed?: number;
  precision?: number;
}

export function CoordinateInput({
  label,
  x,
  y,
  onXChange,
  onYChange,
  min,
  max,
  minX,
  maxX,
  minY,
  maxY,
  dragSpeed = 0.1,
  precision = 0,
}: CoordinateInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] text-zinc-500 uppercase">{label}</span>}
      <div className="flex gap-1">
        {/* X Input */}
        <div className="flex flex-1">
          <div className="text-xs w-5 font-bold bg-red-500 px-1 py-1.5 text-center flex items-center justify-center rounded-l">
            X
          </div>
          <div className="flex-1">
            <DragNumberInput
              value={x}
              onChange={onXChange}
              onInput={onXChange}
              min={minX ?? min}
              max={maxX ?? max}
              dragSpeed={dragSpeed}
              precision={precision}
              roundedLeft={false}
            />
          </div>
        </div>

        {/* Y Input */}
        <div className="flex flex-1">
          <div className="text-xs w-5 font-bold bg-green-500 px-1 py-1.5 text-center flex items-center justify-center rounded-l">
            Y
          </div>
          <div className="flex-1">
            <DragNumberInput
              value={y}
              onChange={onYChange}
              onInput={onYChange}
              min={minY ?? min}
              max={maxY ?? max}
              dragSpeed={dragSpeed}
              precision={precision}
              roundedLeft={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
