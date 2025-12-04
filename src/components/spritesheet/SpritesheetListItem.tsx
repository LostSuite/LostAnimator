import { useRef, useEffect } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import type { Spritesheet } from "../../types";

interface SpritesheetListItemProps {
  spritesheet: Spritesheet;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export function SpritesheetListItem({
  spritesheet,
  onDoubleClick,
  onContextMenu,
}: SpritesheetListItemProps) {
  const { spritesheetImages } = useAnimator();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const image = spritesheetImages.get(spritesheet.id);

  // Draw thumbnail
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw checkerboard background
    const gridSize = 4;
    for (let y = 0; y < canvas.height; y += gridSize) {
      for (let x = 0; x < canvas.width; x += gridSize) {
        const isLight = ((x / gridSize) + (y / gridSize)) % 2 === 0;
        ctx.fillStyle = isLight ? "#3f3f46" : "#27272a";
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }

    // Draw scaled image to fit
    const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, x, y, w, h);
  }, [image]);

  const columns = image ? Math.floor(image.width / spritesheet.tileWidth) : 0;
  const rows = image ? Math.floor(image.height / spritesheet.tileHeight) : 0;
  const frameCount = columns * rows;

  return (
    <div
      className="flex items-center px-2 py-1.5 hover:bg-zinc-700/50 rounded mx-1 cursor-pointer gap-2"
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => onContextMenu(e, spritesheet.id)}
    >
      <canvas
        ref={canvasRef}
        width={28}
        height={28}
        className="flex-shrink-0 rounded border border-zinc-600"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-300 truncate">{spritesheet.name}</div>
        <div className="text-[10px] text-zinc-500">
          {frameCount} frames ({spritesheet.tileWidth}x{spritesheet.tileHeight})
        </div>
      </div>
    </div>
  );
}
