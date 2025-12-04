import { useCallback, useEffect, useRef, useState } from "react";

export interface Transform {
  scale: number;
  panX: number;
  panY: number;
}

export interface UseCanvasZoomPanOptions {
  initialScale?: number;
  initialPan?: { x: number; y: number };
  minScale?: number;
  maxScale?: number;
  zoomSpeed?: number;
}

export interface UseCanvasZoomPanReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  transform: Transform;
  setTransform: (t: Transform) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function useCanvasZoomPan(
  options: UseCanvasZoomPanOptions = {}
): UseCanvasZoomPanReturn {
  const {
    initialScale = 1,
    initialPan = { x: 0, y: 0 },
    minScale = 0.1,
    maxScale = 16,
    zoomSpeed = 0.01,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(initialScale);
  const [pan, setPan] = useState(initialPan);

  // Refs to access current values in event handlers without recreating them
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // Setup wheel event listener for zoom and pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom towards mouse position
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Get world coordinates at mouse position
        const worldX = (mouseX - panRef.current.x) / scaleRef.current;
        const worldY = (mouseY - panRef.current.y) / scaleRef.current;

        // Normalize deltaY to handle both mouse wheels and trackpads
        const normalizedDelta = Math.max(-20, Math.min(20, e.deltaY));

        // Calculate new scale
        const delta = -normalizedDelta * zoomSpeed;
        const newScale = Math.max(
          minScale,
          Math.min(maxScale, scaleRef.current + delta)
        );

        // Adjust pan to keep world position under mouse
        const newPanX = mouseX - worldX * newScale;
        const newPanY = mouseY - worldY * newScale;

        setPan({ x: newPanX, y: newPanY });
        setScale(newScale);
      } else {
        // Pan with scroll
        setPan({
          x: panRef.current.x - e.deltaX,
          y: panRef.current.y - e.deltaY,
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [minScale, maxScale, zoomSpeed]);

  const transform: Transform = {
    scale,
    panX: pan.x,
    panY: pan.y,
  };

  const setTransform = useCallback((t: Transform) => {
    setScale(t.scale);
    setPan({ x: t.panX, y: t.panY });
  }, []);

  const resetView = useCallback(() => {
    setScale(initialScale);
    setPan(initialPan);
  }, [initialScale, initialPan]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(maxScale, s * 1.25));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(minScale, s / 1.25));
  }, [minScale]);

  return {
    containerRef,
    transform,
    setTransform,
    resetView,
    zoomIn,
    zoomOut,
  };
}
