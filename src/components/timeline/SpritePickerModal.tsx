import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAnimator } from "../../context/AnimatorContext";
import { useCanvasZoomPan } from "../../hooks/useCanvasZoomPan";

interface SpritePickerModalProps {
  initialSpritesheetId?: string;
  initialFrame?: [number, number];
  onConfirm: (spritesheetId: string, frame: [number, number]) => void;
  onCancel: () => void;
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

export function SpritePickerModal({
  initialSpritesheetId,
  initialFrame,
  onConfirm,
  onCancel,
}: SpritePickerModalProps) {
  const { spritesheets, spritesheetImages } = useAnimator();

  // Selected spritesheet
  const [selectedSheetId, setSelectedSheetId] = useState<string>(
    initialSpritesheetId ?? spritesheets[0]?.id ?? ""
  );

  // Selected frame
  const [selectedFrame, setSelectedFrame] = useState<[number, number]>(
    initialFrame ?? [0, 0]
  );

  // Hovered frame
  const [hoveredFrame, setHoveredFrame] = useState<[number, number] | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initializedRef = useRef(false);

  const { containerRef, transform, setTransform, zoomIn, zoomOut } = useCanvasZoomPan({
    initialScale: 1,
    minScale: 0.1,
    maxScale: 16,
  });

  const selectedSheet = spritesheets.find((s) => s.id === selectedSheetId);
  const image = selectedSheetId ? spritesheetImages.get(selectedSheetId) : undefined;

  // Calculate fit-to-view transform
  const calculateFitTransform = useCallback(() => {
    const container = containerRef.current;
    if (!container || !image) return null;

    const rect = container.getBoundingClientRect();
    const padding = 32;
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;

    const scaleX = availableWidth / image.width;
    const scaleY = availableHeight / image.height;
    const scale = Math.min(scaleX, scaleY, 16);

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const panX = (rect.width - scaledWidth) / 2;
    const panY = (rect.height - scaledHeight) / 2;

    return { scale, panX, panY };
  }, [containerRef, image]);

  // Reset view when spritesheet changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const fitTransform = calculateFitTransform();
      if (fitTransform) {
        setTransform(fitTransform);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedSheetId, calculateFitTransform, setTransform]);

  // Initialize view on first render
  useEffect(() => {
    if (initializedRef.current) return;
    const timer = setTimeout(() => {
      const fitTransform = calculateFitTransform();
      if (fitTransform) {
        setTransform(fitTransform);
        initializedRef.current = true;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [calculateFitTransform, setTransform]);

  const resetView = useCallback(() => {
    const fitTransform = calculateFitTransform();
    if (fitTransform) {
      setTransform(fitTransform);
    }
  }, [calculateFitTransform, setTransform]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Get tile coordinates from mouse position
  const getTileFromMouse = useCallback(
    (e: React.MouseEvent): [number, number] | null => {
      if (!image || !selectedSheet) return null;

      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert to world coordinates
      const worldX = (mouseX - transform.panX) / transform.scale;
      const worldY = (mouseY - transform.panY) / transform.scale;

      // Check bounds
      if (worldX < 0 || worldY < 0 || worldX >= image.width || worldY >= image.height) {
        return null;
      }

      const col = Math.floor(worldX / selectedSheet.tileWidth);
      const row = Math.floor(worldY / selectedSheet.tileHeight);

      const columns = Math.floor(image.width / selectedSheet.tileWidth);
      const rows = Math.floor(image.height / selectedSheet.tileHeight);

      if (col >= columns || row >= rows) return null;

      return [col, row];
    },
    [image, selectedSheet, transform]
  );

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      const tile = getTileFromMouse(e);
      if (tile) {
        setSelectedFrame(tile);
      }
    },
    [getTileFromMouse]
  );

  // Handle canvas double-click (auto-confirm)
  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const tile = getTileFromMouse(e);
      if (tile && selectedSheetId) {
        onConfirm(selectedSheetId, tile);
      }
    },
    [getTileFromMouse, selectedSheetId, onConfirm]
  );

  // Handle mouse move for hover
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const tile = getTileFromMouse(e);
      setHoveredFrame(tile);
    },
    [getTileFromMouse]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredFrame(null);
  }, []);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !image || !selectedSheet) return;

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

    // Draw tile grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1 / transform.scale;

    const columns = Math.floor(imgW / selectedSheet.tileWidth);
    const rows = Math.floor(imgH / selectedSheet.tileHeight);

    for (let x = 0; x <= columns; x++) {
      const px = x * selectedSheet.tileWidth;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, rows * selectedSheet.tileHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= rows; y++) {
      const py = y * selectedSheet.tileHeight;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(columns * selectedSheet.tileWidth, py);
      ctx.stroke();
    }

    // Draw hovered tile
    if (hoveredFrame) {
      const [hCol, hRow] = hoveredFrame;
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(
        hCol * selectedSheet.tileWidth,
        hRow * selectedSheet.tileHeight,
        selectedSheet.tileWidth,
        selectedSheet.tileHeight
      );
    }

    // Draw selected tile
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2 / transform.scale;
    ctx.strokeRect(
      selectedFrame[0] * selectedSheet.tileWidth,
      selectedFrame[1] * selectedSheet.tileHeight,
      selectedSheet.tileWidth,
      selectedSheet.tileHeight
    );

    // Fill selected tile with semi-transparent blue
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
    ctx.fillRect(
      selectedFrame[0] * selectedSheet.tileWidth,
      selectedFrame[1] * selectedSheet.tileHeight,
      selectedSheet.tileWidth,
      selectedSheet.tileHeight
    );

    ctx.restore();
  }, [image, selectedSheet, transform, containerRef, selectedFrame, hoveredFrame]);

  // Redraw on state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleConfirm = () => {
    if (selectedSheetId) {
      onConfirm(selectedSheetId, selectedFrame);
    }
  };

  if (spritesheets.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
        <div className="relative bg-zinc-900 rounded-lg p-6 border border-zinc-700">
          <p className="text-zinc-400">No spritesheets available. Add a spritesheet first.</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

      {/* Modal content */}
      <div className="relative flex flex-col flex-1 m-8 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
        {/* Header */}
        <div className="h-10 flex items-center px-4 border-b border-zinc-700 bg-zinc-800/50">
          <h2 className="text-sm font-medium text-zinc-200">Pick a Sprite</h2>
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-100"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - spritesheet list */}
          <div className="w-48 border-r border-zinc-700 bg-zinc-800/30 flex flex-col">
            <div className="px-3 py-2 border-b border-zinc-700/50">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Spritesheets
              </span>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {spritesheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => {
                    setSelectedSheetId(sheet.id);
                    setSelectedFrame([0, 0]);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${
                    sheet.id === selectedSheetId
                      ? "bg-blue-500/20 text-blue-300"
                      : "text-zinc-300 hover:bg-zinc-700/50"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sheet.id === selectedSheetId ? "bg-blue-500" : "bg-zinc-600"
                    }`}
                  />
                  <span className="truncate">{sheet.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main area - canvas */}
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
                Scroll to pan, Ctrl+scroll to zoom, Click to select
              </span>
              <div className="flex-1" />
              <span className="text-xs text-zinc-400">
                Frame: [{selectedFrame[0]}, {selectedFrame[1]}]
              </span>
            </div>

            {/* Canvas container */}
            <div ref={containerRef} className="flex-1 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="block cursor-crosshair"
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 flex items-center justify-end gap-2 px-4 border-t border-zinc-700 bg-zinc-800/50">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
