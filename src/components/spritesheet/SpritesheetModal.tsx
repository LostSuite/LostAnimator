import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAnimator } from "../../context/AnimatorContext";
import { useCanvasZoomPan } from "../../hooks/useCanvasZoomPan";
import { DragNumberInput } from "../ui/DragNumberInput";

interface SpritesheetModalProps {
  spritesheetId: string;
  onClose: () => void;
}

const ZoomInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export function SpritesheetModal({ spritesheetId, onClose }: SpritesheetModalProps) {
  const { spritesheets, spritesheetImages, updateSpritesheet } = useAnimator();
  const spritesheet = spritesheets.find((s) => s.id === spritesheetId);
  const image = spritesheetImages.get(spritesheetId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initializedRef = useRef(false);
  const { containerRef, transform, setTransform, zoomIn, zoomOut } = useCanvasZoomPan({
    initialScale: 1,
    minScale: 0.1,
    maxScale: 16,
  });

  // Calculate fit-to-view transform
  const calculateFitTransform = useCallback(() => {
    const container = containerRef.current;
    if (!container || !image) return null;

    const rect = container.getBoundingClientRect();
    const padding = 32; // Padding from edges
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;

    // Calculate scale to fit image in container
    const scaleX = availableWidth / image.width;
    const scaleY = availableHeight / image.height;
    const scale = Math.min(scaleX, scaleY, 16); // Cap at max scale

    // Calculate pan to center the image
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const panX = (rect.width - scaledWidth) / 2;
    const panY = (rect.height - scaledHeight) / 2;

    return { scale, panX, panY };
  }, [containerRef, image]);

  // Initialize view to fit image on first render
  useEffect(() => {
    if (initializedRef.current) return;

    // Small delay to ensure container is properly sized
    const timer = setTimeout(() => {
      const fitTransform = calculateFitTransform();
      if (fitTransform) {
        setTransform(fitTransform);
        initializedRef.current = true;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [calculateFitTransform, setTransform]);

  // Reset view function that fits to container
  const resetView = useCallback(() => {
    const fitTransform = calculateFitTransform();
    if (fitTransform) {
      setTransform(fitTransform);
    }
  }, [calculateFitTransform, setTransform]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !image || !spritesheet) return;

    // Resize canvas to container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard pattern
    ctx.save();
    ctx.translate(transform.panX, transform.panY);
    ctx.scale(transform.scale, transform.scale);

    const gridSize = 16;
    const imgW = image.width;
    const imgH = image.height;

    for (let y = 0; y < imgH; y += gridSize) {
      for (let x = 0; x < imgW; x += gridSize) {
        const isLight = ((x / gridSize) + (y / gridSize)) % 2 === 0;
        ctx.fillStyle = isLight ? "#3f3f46" : "#27272a";
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }

    // Draw image
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);

    // Draw grid overlay
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1 / transform.scale;

    const columns = Math.floor(imgW / spritesheet.tileWidth);
    const rows = Math.floor(imgH / spritesheet.tileHeight);

    for (let x = 0; x <= columns; x++) {
      const px = x * spritesheet.tileWidth;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, imgH);
      ctx.stroke();
    }

    for (let y = 0; y <= rows; y++) {
      const py = y * spritesheet.tileHeight;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(imgW, py);
      ctx.stroke();
    }

    ctx.restore();
  }, [image, spritesheet, transform, containerRef]);

  // Redraw on transform or spritesheet change
  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  if (!spritesheet || !image) return null;

  const handleUpdate = (updates: Partial<typeof spritesheet>) => {
    updateSpritesheet(spritesheetId, updates);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative flex flex-1 m-8 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="h-10 flex items-center px-4 gap-2 border-b border-zinc-700 bg-zinc-800/50">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
              title="Zoom out"
            >
              <ZoomOutIcon />
            </button>
            <span className="text-xs text-zinc-400 font-mono w-14 text-center">
              {Math.round(transform.scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
              title="Zoom in"
            >
              <ZoomInIcon />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
              title="Reset view"
            >
              <ResetIcon />
            </button>
            <span className="text-xs text-zinc-500 ml-2">
              Scroll to pan, Ctrl+scroll to zoom
            </span>
          </div>

          {/* Canvas container */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden"
          >
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        {/* Settings sidebar */}
        <div className="w-64 border-l border-zinc-700 p-4 flex flex-col gap-4 bg-zinc-800/30">
          <div>
            <h2 className="text-sm font-medium text-zinc-200 truncate">
              {spritesheet.name}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1">
              {image.width}x{image.height}px
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <DragNumberInput
                label="Tile Width"
                value={spritesheet.tileWidth}
                onChange={(v) => handleUpdate({ tileWidth: Math.max(1, Math.round(v)) })}
                onInput={(v) => handleUpdate({ tileWidth: Math.max(1, Math.round(v)) })}
                min={1}
                max={image.width}
                dragSpeed={0.5}
                precision={0}
              />
              <DragNumberInput
                label="Tile Height"
                value={spritesheet.tileHeight}
                onChange={(v) => handleUpdate({ tileHeight: Math.max(1, Math.round(v)) })}
                onInput={(v) => handleUpdate({ tileHeight: Math.max(1, Math.round(v)) })}
                min={1}
                max={image.height}
                dragSpeed={0.5}
                precision={0}
              />
            </div>
          </div>

          {(() => {
            const columns = Math.floor(image.width / spritesheet.tileWidth);
            const rows = Math.floor(image.height / spritesheet.tileHeight);
            return (
              <div className="text-xs text-zinc-500 bg-zinc-800 rounded p-2">
                {columns} × {rows} = {columns * rows} frames
              </div>
            );
          })()}

          <div className="mt-auto">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
