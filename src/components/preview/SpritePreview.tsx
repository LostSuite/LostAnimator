import { useRef, useEffect, useState } from "react";
import { useAnimator } from "../../context/AnimatorContext";
import type { SpriteTrack, SpriteKey, TweenTrack, TweenKey, EventTrack, EventKey, Point } from "../../types";
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

  // Find all tween keys active at current time
  const currentTweenKeys = (() => {
    if (!selectedAnimation) return [];

    const tweenTracks = selectedAnimation.tracks.filter(
      (t) => t.type === "tween"
    ) as TweenTrack[];

    const { currentTime } = playback;
    const keys: TweenKey[] = [];

    for (const track of tweenTracks) {
      for (const key of track.keys) {
        // Tween is active if currentTime is within [time, time + duration)
        if (currentTime >= key.time && currentTime < key.time + key.duration) {
          keys.push(key);
        }
      }
    }

    return keys;
  })();

  // Find all event keys at current time (show briefly when triggered)
  const currentEventKeys = (() => {
    if (!selectedAnimation) return [];

    const eventTracks = selectedAnimation.tracks.filter(
      (t) => t.type === "event"
    ) as EventTrack[];

    const { currentTime } = playback;
    const keys: EventKey[] = [];

    for (const track of eventTracks) {
      for (const key of track.keys) {
        // Show event anchor for a brief window (0.1s after event time)
        if (currentTime >= key.time && currentTime < key.time + 0.1) {
          keys.push(key);
        }
      }
    }

    return keys;
  })();

  // Anchor colors matching the sidebar
  const anchorColors = [
    "#f59e0b", // amber
    "#10b981", // emerald
    "#3b82f6", // blue
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
  ];

  // Collect all non-sprite anchors to render
  const otherAnchors: { name: string; pos: Point; color: string }[] = [];

  currentTweenKeys.forEach((key) => {
    Object.entries(key.anchors).forEach(([name, pos], anchorIdx) => {
      otherAnchors.push({
        name,
        pos,
        color: anchorColors[anchorIdx % anchorColors.length],
      });
    });
  });

  currentEventKeys.forEach((key) => {
    Object.entries(key.anchors).forEach(([name, pos], anchorIdx) => {
      otherAnchors.push({
        name,
        pos,
        color: anchorColors[anchorIdx % anchorColors.length],
      });
    });
  });

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

        // Calculate source position
        const sx = spriteKey.frame.x * tileWidth;
        const sy = spriteKey.frame.y * tileHeight;

        // Calculate destination (centered, scale to fit with padding)
        const padding = 16;
        const scale = Math.min(
          (canvas.width - padding * 2) / tileWidth,
          (canvas.height - padding * 2) / tileHeight
        );
        const dw = tileWidth * scale;
        const dh = tileHeight * scale;
        // Apply offset (scaled)
        const dx = (canvas.width - dw) / 2 + spriteKey.offset.x * scale;
        const dy = (canvas.height - dh) / 2 + spriteKey.offset.y * scale;

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

        // Draw anchors for this sprite key
        const anchorEntries = Object.entries(spriteKey.anchors);
        if (anchorEntries.length > 0) {
          for (let i = 0; i < anchorEntries.length; i++) {
            const [anchorName, anchorPos] = anchorEntries[i];
            const color = anchorColors[i % anchorColors.length];

            // Calculate anchor position in canvas space
            // Anchor position is relative to sprite origin (top-left of tile)
            // Add 0.5 to center the marker on the pixel
            let anchorX = dx + (anchorPos.x + 0.5) * scale;
            let anchorY = dy + (anchorPos.y + 0.5) * scale;

            // If flipped, adjust anchor position
            if (spriteKey.flip) {
              const flipH = spriteKey.flip === "horizontal" || spriteKey.flip === "both";
              const flipV = spriteKey.flip === "vertical" || spriteKey.flip === "both";

              if (flipH) {
                anchorX = dx + dw - (anchorPos.x + 0.5) * scale;
              }
              if (flipV) {
                anchorY = dy + dh - (anchorPos.y + 0.5) * scale;
              }
            }

            // Draw anchor marker (filled circle with outline)
            ctx.beginPath();
            ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw anchor name label
            ctx.font = "9px sans-serif";
            ctx.fillStyle = color;
            ctx.textAlign = "left";
            ctx.fillText(anchorName, anchorX + 6, anchorY + 3);
          }
        }
      }
    }

    // Draw tween/event anchors (rendered at canvas center since they're not tied to a sprite)
    if (otherAnchors.length > 0) {
      // Get scale from first sprite if available, otherwise use a default
      let scale = 4; // Default scale
      if (currentSpriteKeys.length > 0) {
        const firstKey = currentSpriteKeys[0];
        const spritesheetData = getSpritesheetForKey(firstKey);
        if (spritesheetData) {
          const { tileWidth, tileHeight } = spritesheetData.config;
          const padding = 16;
          scale = Math.min(
            (canvas.width - padding * 2) / tileWidth,
            (canvas.height - padding * 2) / tileHeight
          );
        }
      }

      // Calculate base position (canvas center)
      const baseDx = (canvas.width - (currentSpriteKeys.length > 0 ? 0 : 0)) / 2;
      const baseDy = (canvas.height - (currentSpriteKeys.length > 0 ? 0 : 0)) / 2;

      for (const anchor of otherAnchors) {
        // Position relative to canvas center
        const anchorX = baseDx + (anchor.pos.x + 0.5) * scale;
        const anchorY = baseDy + (anchor.pos.y + 0.5) * scale;

        // Draw anchor marker (filled circle with outline)
        ctx.beginPath();
        ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
        ctx.fillStyle = anchor.color;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw anchor name label
        ctx.font = "9px sans-serif";
        ctx.fillStyle = anchor.color;
        ctx.textAlign = "left";
        ctx.fillText(anchor.name, anchorX + 6, anchorY + 3);
      }
    }

    if (currentSpriteKeys.length === 0 && spritesheets.length === 0) {
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
  }, [getSpritesheetForKey, spritesheets, currentSpriteKeys, otherAnchors, canvasSize]);

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
