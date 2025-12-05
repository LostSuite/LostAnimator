import { useRef, useEffect, useState } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import type { SpriteTrack, SpriteKey } from "../../types";
import { getSpriteKeyDuration } from "../../types";

export function SpritePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 160, height: 160 });
  const { getSpritesheetForKey, spritesheets, selectedAnimation, playback } =
    useAnimator();

  // Resize canvas to fit container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width - 16, rect.height - 16);
      if (size > 0) {
        setCanvasSize({ width: size, height: size });
      }
    };

    // Initial size
    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Find all sprite keys at current time (one per sprite track, in track order)
  const currentSpriteKeys = (() => {
    if (!selectedAnimation) return [];

    const spriteTracks = selectedAnimation.tracks.filter(
      (t) => t.type === "sprite"
    ) as SpriteTrack[];

    const { currentTime } = playback;
    const animationDuration = selectedAnimation.duration;

    const keys: SpriteKey[] = [];

    for (const track of spriteTracks) {
      // Sort keys by time for proper duration calculation
      const sortedKeys = [...track.keys].sort((a, b) => a.time - b.time);

      // Find key that contains current time
      let foundKey: SpriteKey | null = null;
      for (const key of sortedKeys) {
        const duration = getSpriteKeyDuration(key, track, animationDuration);
        if (currentTime >= key.time && currentTime < key.time + duration) {
          foundKey = key;
          break;
        }
      }

      // If past all keys, use last key
      if (!foundKey && sortedKeys.length > 0) {
        const lastKey = sortedKeys[sortedKeys.length - 1];
        if (currentTime >= lastKey.time) {
          foundKey = lastKey;
        }
      }

      if (foundKey) {
        keys.push(foundKey);
      }
    }

    return keys;
  })();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#27272a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard pattern for transparency
    const gridSize = 16;
    for (let y = 0; y < canvas.height; y += gridSize) {
      for (let x = 0; x < canvas.width; x += gridSize) {
        const isLight = ((x / gridSize) + (y / gridSize)) % 2 === 0;
        ctx.fillStyle = isLight ? "#3f3f46" : "#27272a";
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }

    // Draw all sprite keys in order (first track at bottom, last on top)
    if (currentSpriteKeys.length > 0) {
      for (const spriteKey of currentSpriteKeys) {
        const spritesheetData = getSpritesheetForKey(spriteKey);
        if (!spritesheetData) continue;

        const { config, image } = spritesheetData;
        const { tileWidth, tileHeight } = config;
        const [col, row] = spriteKey.frame;

        // Calculate source position
        const sx = col * tileWidth;
        const sy = row * tileHeight;

        // Calculate destination (centered, scale to fit)
        const scale = Math.min(
          (canvas.width - 32) / tileWidth,
          (canvas.height - 32) / tileHeight
        );
        const dw = tileWidth * scale;
        const dh = tileHeight * scale;
        // Apply offset (scaled)
        const dx = (canvas.width - dw) / 2 + spriteKey.offset[0] * scale;
        const dy = (canvas.height - dh) / 2 + spriteKey.offset[1] * scale;

        // Handle flipping
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (spriteKey.flip) {
          const flipH =
            spriteKey.flip === "horizontal" ||
            spriteKey.flip === "both";
          const flipV =
            spriteKey.flip === "vertical" ||
            spriteKey.flip === "both";

          ctx.translate(
            flipH ? dx + dw : dx,
            flipV ? dy + dh : dy
          );
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
          ctx.drawImage(
            image,
            sx,
            sy,
            tileWidth,
            tileHeight,
            0,
            0,
            dw,
            dh
          );
        } else {
          ctx.drawImage(
            image,
            sx,
            sy,
            tileWidth,
            tileHeight,
            dx,
            dy,
            dw,
            dh
          );
        }

        ctx.restore();
      }
    } else if (spritesheets.length === 0) {
      // No spritesheet loaded
      ctx.fillStyle = "#71717a";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Load a spritesheet to preview",
        canvas.width / 2,
        canvas.height / 2
      );
    }
  }, [getSpritesheetForKey, spritesheets, currentSpriteKeys, canvasSize]);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center p-2 min-h-0">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="border border-zinc-700 rounded flex-shrink-0"
      />
    </div>
  );
}
