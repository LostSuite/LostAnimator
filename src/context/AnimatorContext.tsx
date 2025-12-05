import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { listen } from "@tauri-apps/api/event";
import { useUndoableReducer } from "../hooks/useUndoableReducer";
import { useRegisterUndoRedo } from "./UndoRedoContext";
import {
  type AnimationFile,
  type Animation,
  type Spritesheet,
  createDefaultAnimationFile,
  createDefaultAnimation,
} from "../types/animation";
import {
  type Track,
  type Key,
  type TrackType,
  type SpriteKey,
  type TweenKey,
  type EventKey,
  createSpriteTrack,
  createTweenTrack,
  createEventTrack,
} from "../types/tracks";
import {
  type SelectionState,
  type PlaybackState,
  type TimelineViewState,
  createDefaultPlaybackState,
  createDefaultTimelineViewState,
} from "../types/editor";
import { generateId } from "../utils/id";
import {
  openAnimationFile,
  saveAnimationFile,
  createNewFile,
} from "../services/fileService";
import { openImageFile, loadImage } from "../services/imageService";

interface AnimatorContextType {
  // File operations
  newFile: () => void;
  openFile: () => Promise<void>;
  saveFile: () => Promise<void>;
  saveFileAs: () => Promise<void>;
  filePath: string | null;
  isDirty: boolean;

  // Spritesheets
  spritesheets: Spritesheet[];
  spritesheetImages: Map<string, HTMLImageElement>;
  selectedSpritesheetId: string | null;
  addSpritesheet: () => Promise<void>;
  removeSpritesheet: (id: string) => void;
  updateSpritesheet: (id: string, updates: Partial<Spritesheet>) => void;
  reorderSpritesheets: (fromIndex: number, toIndex: number) => void;
  selectSpritesheet: (id: string | null) => void;
  getSpritesheetForKey: (key: SpriteKey) => { config: Spritesheet; image: HTMLImageElement } | null;

  // Animations
  animations: Animation[];
  selectedAnimationId: string | null;
  selectedAnimation: Animation | null;
  selectAnimation: (id: string | null) => void;
  addAnimation: () => void;
  removeAnimation: (id: string) => void;
  updateAnimation: (id: string, updates: Partial<Animation>) => void;
  duplicateAnimation: (id: string) => void;
  reorderAnimations: (fromIndex: number, toIndex: number) => void;

  // Tracks
  addTrack: (type: TrackType) => void;
  removeTrack: (trackId: string) => void;
  renameTrack: (trackId: string, name: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;

  // Keys
  addKey: (trackId: string, key: Key) => void;
  removeKey: (trackId: string, keyId: string) => void;
  updateKey: (trackId: string, keyId: string, updates: Partial<Key>) => void;

  // Selection
  selection: SelectionState;
  setSelection: (selection: SelectionState) => void;

  // Playback
  playback: PlaybackState;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentTime: (time: number) => void;

  // Timeline view
  timeline: TimelineViewState;
  setTimelineZoom: (zoom: number) => void;
  setTimelineScroll: (scrollX: number) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  startBatch: () => void;
  endBatch: () => void;
}

const AnimatorContext = createContext<AnimatorContextType | null>(null);

export function useAnimator(): AnimatorContextType {
  const context = useContext(AnimatorContext);
  if (!context) {
    throw new Error("useAnimator must be used within AnimatorProvider");
  }
  return context;
}

interface AnimatorProviderProps {
  children: ReactNode;
}

export function AnimatorProvider({ children }: AnimatorProviderProps) {
  // Core state with undo/redo
  const [animationFile, setAnimationFile, undoControls] =
    useUndoableReducer<AnimationFile>(createDefaultAnimationFile());

  // Runtime state (not undoable)
  const [spritesheetImages, setSpritesheetImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [selectedSpritesheetId, setSelectedSpritesheetId] = useState<string | null>(null);
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(
    null
  );
  const [selection, setSelection] = useState<SelectionState>({ type: "none" });
  const [playback, setPlayback] = useState<PlaybackState>(
    createDefaultPlaybackState()
  );
  const [timeline, setTimeline] = useState<TimelineViewState>(
    createDefaultTimelineViewState()
  );
  const [filePath, setFilePath] = useState<string | null>(null);
  const filePathRef = useRef<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Refs for menu callback functions (to avoid stale closures in event listeners)
  const saveFileRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const saveFileAsRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const newFileRef = useRef<() => void>(() => {});
  const openFileRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const timelineRef = useRef(timeline);

  // Keep refs in sync with state for use in event listeners
  useEffect(() => {
    filePathRef.current = filePath;
  }, [filePath]);
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  // Register undo/redo with global keyboard shortcuts
  useRegisterUndoRedo({
    undo: undoControls.undo,
    redo: undoControls.redo,
    canUndo: undoControls.canUndo,
    canRedo: undoControls.canRedo,
  });

  // Computed values
  const selectedAnimation =
    animationFile.animations.find((a) => a.id === selectedAnimationId) ?? null;

  // Sync timeline settings when selected animation changes
  useEffect(() => {
    if (selectedAnimation) {
      setTimeline((t) => ({
        ...t,
        snapToGrid: selectedAnimation.snapToGrid,
        gridSize: selectedAnimation.gridSize,
      }));
    }
  }, [selectedAnimationId]); // Only trigger on animation selection change, not on every animation update

  // Helper to update and mark dirty
  const updateFile = useCallback(
    (updater: (file: AnimationFile) => AnimationFile) => {
      setAnimationFile((prev) => updater(prev));
      setIsDirty(true);
    },
    [setAnimationFile]
  );

  // File operations
  const newFile = useCallback(() => {
    undoControls.reset(createNewFile());
    setFilePath(null);
    setIsDirty(false);
    setSelectedAnimationId(null);
    setSelection({ type: "none" });
    setSpritesheetImages(new Map());
    setSelectedSpritesheetId(null);
  }, [undoControls]);

  const openFile = useCallback(async () => {
    const result = await openAnimationFile();
    if (!result) return;

    undoControls.reset(result.content);
    setFilePath(result.path);
    setIsDirty(false);
    setSelectedAnimationId(null);
    setSelection({ type: "none" });
    setSelectedSpritesheetId(null);

    // Load all spritesheets
    const imageMap = new Map<string, HTMLImageElement>();
    for (const spritesheet of result.content.spritesheets) {
      try {
        const img = await loadImage(spritesheet.imagePath);
        imageMap.set(spritesheet.id, img);
      } catch (e) {
        console.error(`Failed to load spritesheet ${spritesheet.name}:`, e);
      }
    }
    setSpritesheetImages(imageMap);
  }, [undoControls]);

  const saveFile = useCallback(async () => {
    // Use ref to get current filePath to avoid stale closure issues with event listeners
    const savedPath = await saveAnimationFile(animationFile, filePathRef.current);
    if (savedPath) {
      setFilePath(savedPath);
      setIsDirty(false);
    }
  }, [animationFile]);

  const saveFileAs = useCallback(async () => {
    const savedPath = await saveAnimationFile(animationFile, null);
    if (savedPath) {
      setFilePath(savedPath);
      setIsDirty(false);
    }
  }, [animationFile]);

  // Keep function refs in sync (for menu event listeners)
  useEffect(() => { newFileRef.current = newFile; }, [newFile]);
  useEffect(() => { openFileRef.current = openFile; }, [openFile]);
  useEffect(() => { saveFileRef.current = saveFile; }, [saveFile]);
  useEffect(() => { saveFileAsRef.current = saveFileAs; }, [saveFileAs]);

  // Spritesheets
  const addSpritesheet = useCallback(async () => {
    const result = await openImageFile();
    if (!result) return;

    const id = generateId();
    const name = result.path.split("/").pop() ?? "Spritesheet";

    const spritesheet: Spritesheet = {
      id,
      name,
      imagePath: result.path,
      tileWidth: 32,
      tileHeight: 32,
    };

    setSpritesheetImages((prev) => new Map(prev).set(id, result.image));
    updateFile((file) => ({
      ...file,
      spritesheets: [...file.spritesheets, spritesheet],
    }));
  }, [updateFile]);

  const removeSpritesheet = useCallback(
    (id: string) => {
      setSpritesheetImages((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      updateFile((file) => ({
        ...file,
        spritesheets: file.spritesheets.filter((s) => s.id !== id),
      }));
      if (selectedSpritesheetId === id) {
        setSelectedSpritesheetId(null);
      }
    },
    [selectedSpritesheetId, updateFile]
  );

  const updateSpritesheet = useCallback(
    (id: string, updates: Partial<Spritesheet>) => {
      updateFile((file) => ({
        ...file,
        spritesheets: file.spritesheets.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }));
    },
    [updateFile]
  );

  const reorderSpritesheets = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      updateFile((file) => {
        const newSpritesheets = [...file.spritesheets];
        const [removed] = newSpritesheets.splice(fromIndex, 1);
        newSpritesheets.splice(toIndex, 0, removed);
        return { ...file, spritesheets: newSpritesheets };
      });
    },
    [updateFile]
  );

  const selectSpritesheet = useCallback((id: string | null) => {
    setSelectedSpritesheetId(id);
  }, []);

  const getSpritesheetForKey = useCallback(
    (key: SpriteKey): { config: Spritesheet; image: HTMLImageElement } | null => {
      const spritesheets = animationFile.spritesheets;
      const spritesheetId = key.spritesheetId ?? spritesheets[0]?.id;
      if (!spritesheetId) return null;

      const config = spritesheets.find((s) => s.id === spritesheetId);
      const image = spritesheetImages.get(spritesheetId);

      if (!config || !image) return null;
      return { config, image };
    },
    [animationFile.spritesheets, spritesheetImages]
  );

  // Animation CRUD
  const selectAnimation = useCallback((id: string | null) => {
    setSelectedAnimationId(id);
    setSelection(id ? { type: "animation", animationId: id } : { type: "none" });
  }, []);

  const addAnimation = useCallback(() => {
    const id = generateId();
    const name = `Animation ${animationFile.animations.length + 1}`;
    updateFile((file) => ({
      ...file,
      animations: [...file.animations, createDefaultAnimation(id, name)],
    }));
    setSelectedAnimationId(id);
  }, [animationFile.animations.length, updateFile]);

  const removeAnimation = useCallback(
    (id: string) => {
      updateFile((file) => ({
        ...file,
        animations: file.animations.filter((a) => a.id !== id),
      }));
      if (selectedAnimationId === id) {
        setSelectedAnimationId(null);
        setSelection({ type: "none" });
      }
    },
    [selectedAnimationId, updateFile]
  );

  const updateAnimation = useCallback(
    (id: string, updates: Partial<Animation>) => {
      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      }));
    },
    [updateFile]
  );

  const duplicateAnimation = useCallback(
    (id: string) => {
      const original = animationFile.animations.find((a) => a.id === id);
      if (!original) return;

      const newId = generateId();

      // Clone tracks while preserving discriminated union types
      const cloneTrack = (track: Track): Track => {
        const newTrackId = generateId();
        switch (track.type) {
          case "sprite":
            return {
              type: "sprite",
              id: newTrackId,
              name: track.name,
              keys: track.keys.map((k) => ({ ...k, id: generateId() })),
            };
          case "tween":
            return {
              type: "tween",
              id: newTrackId,
              name: track.name,
              keys: track.keys.map((k) => ({ ...k, id: generateId() })),
            };
          case "event":
            return {
              type: "event",
              id: newTrackId,
              name: track.name,
              keys: track.keys.map((k) => ({ ...k, id: generateId() })),
            };
        }
      };

      const newAnimation: Animation = {
        ...original,
        id: newId,
        name: `${original.name} (copy)`,
        tracks: original.tracks.map(cloneTrack),
      };

      updateFile((file) => ({
        ...file,
        animations: [...file.animations, newAnimation],
      }));
    },
    [animationFile.animations, updateFile]
  );

  const reorderAnimations = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      updateFile((file) => {
        const newAnimations = [...file.animations];
        const [removed] = newAnimations.splice(fromIndex, 1);
        newAnimations.splice(toIndex, 0, removed);
        return { ...file, animations: newAnimations };
      });
    },
    [updateFile]
  );

  // Track CRUD
  const addTrack = useCallback(
    (type: TrackType) => {
      if (!selectedAnimationId) return;

      const trackId = generateId();
      const trackName = type === "sprite" ? "Sprite" : type === "tween" ? "Tween" : "Event";
      const track =
        type === "sprite"
          ? createSpriteTrack(trackId, trackName)
          : type === "tween"
            ? createTweenTrack(trackId, trackName)
            : createEventTrack(trackId, trackName);

      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === selectedAnimationId
            ? { ...a, tracks: [...a.tracks, track] }
            : a
        ),
      }));
    },
    [selectedAnimationId, updateFile]
  );

  const removeTrack = useCallback(
    (trackId: string) => {
      if (!selectedAnimationId) return;

      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === selectedAnimationId
            ? { ...a, tracks: a.tracks.filter((t) => t.id !== trackId) }
            : a
        ),
      }));
    },
    [selectedAnimationId, updateFile]
  );

  const renameTrack = useCallback(
    (trackId: string, name: string) => {
      if (!selectedAnimationId) return;

      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === selectedAnimationId
            ? {
                ...a,
                tracks: a.tracks.map((t) =>
                  t.id === trackId ? { ...t, name } : t
                ),
              }
            : a
        ),
      }));
    },
    [selectedAnimationId, updateFile]
  );

  const reorderTracks = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || !selectedAnimationId) return;

      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) => {
          if (a.id !== selectedAnimationId) return a;
          const newTracks = [...a.tracks];
          const [removed] = newTracks.splice(fromIndex, 1);
          newTracks.splice(toIndex, 0, removed);
          return { ...a, tracks: newTracks };
        }),
      }));
    },
    [selectedAnimationId, updateFile]
  );

  // Key CRUD
  const addKey = useCallback(
    (trackId: string, key: Key) => {
      if (!selectedAnimationId) return;

      const updateTrack = (track: Track): Track => {
        if (track.id !== trackId) return track;
        switch (track.type) {
          case "sprite":
            return {
              ...track,
              keys: [...track.keys, key as SpriteKey],
            };
          case "tween":
            return {
              ...track,
              keys: [...track.keys, key as TweenKey],
            };
          case "event":
            return {
              ...track,
              keys: [...track.keys, key as EventKey],
            };
        }
      };

      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === selectedAnimationId
            ? { ...a, tracks: a.tracks.map(updateTrack) }
            : a
        ),
      }));
    },
    [selectedAnimationId, updateFile]
  );

  const removeKey = useCallback(
    (trackId: string, keyId: string) => {
      if (!selectedAnimationId) return;

      const updateTrack = (track: Track): Track => {
        if (track.id !== trackId) return track;
        switch (track.type) {
          case "sprite":
            return { ...track, keys: track.keys.filter((k) => k.id !== keyId) };
          case "tween":
            return { ...track, keys: track.keys.filter((k) => k.id !== keyId) };
          case "event":
            return { ...track, keys: track.keys.filter((k) => k.id !== keyId) };
        }
      };

      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === selectedAnimationId
            ? { ...a, tracks: a.tracks.map(updateTrack) }
            : a
        ),
      }));
    },
    [selectedAnimationId, updateFile]
  );

  const updateKey = useCallback(
    (trackId: string, keyId: string, updates: Partial<Key>) => {
      if (!selectedAnimationId) return;

      const updateTrack = (track: Track): Track => {
        if (track.id !== trackId) return track;
        switch (track.type) {
          case "sprite":
            return {
              ...track,
              keys: track.keys.map((k) =>
                k.id === keyId ? { ...k, ...updates } as SpriteKey : k
              ),
            };
          case "tween":
            return {
              ...track,
              keys: track.keys.map((k) =>
                k.id === keyId ? { ...k, ...updates } as TweenKey : k
              ),
            };
          case "event":
            return {
              ...track,
              keys: track.keys.map((k) =>
                k.id === keyId ? { ...k, ...updates } as EventKey : k
              ),
            };
        }
      };

      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === selectedAnimationId
            ? { ...a, tracks: a.tracks.map(updateTrack) }
            : a
        ),
      }));
    },
    [selectedAnimationId, updateFile]
  );

  // Playback
  const play = useCallback(() => {
    setPlayback((p) => ({ ...p, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setPlayback((p) => ({ ...p, isPlaying: false }));
  }, []);

  const stop = useCallback(() => {
    setPlayback((p) => ({ ...p, isPlaying: false, currentTime: 0 }));
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    setPlayback((p) => ({ ...p, currentTime: Math.max(0, time) }));
  }, []);

  // Timeline view
  const setTimelineZoom = useCallback((zoom: number) => {
    setTimeline((t) => ({ ...t, zoom: Math.max(50, Math.min(500, zoom)) }));
  }, []);

  const setTimelineScroll = useCallback((scrollX: number) => {
    setTimeline((t) => ({ ...t, scrollX: Math.max(0, scrollX) }));
  }, []);

  const setSnapToGrid = useCallback((enabled: boolean) => {
    setTimeline((t) => ({ ...t, snapToGrid: enabled }));
    // Also update the selected animation
    if (selectedAnimationId) {
      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === selectedAnimationId ? { ...a, snapToGrid: enabled } : a
        ),
      }));
    }
  }, [selectedAnimationId, updateFile]);

  const setGridSize = useCallback((size: number) => {
    const clampedSize = Math.max(0.01, size);
    setTimeline((t) => ({ ...t, gridSize: clampedSize }));
    // Also update the selected animation
    if (selectedAnimationId) {
      updateFile((file) => ({
        ...file,
        animations: file.animations.map((a) =>
          a.id === selectedAnimationId ? { ...a, gridSize: clampedSize } : a
        ),
      }));
    }
  }, [selectedAnimationId, updateFile]);

  // Listen for menu events from Tauri (set up once, use refs to call latest functions)
  useEffect(() => {
    let mounted = true;
    const unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      const u1 = await listen("menu-new", () => {
        if (!mounted) return;
        newFileRef.current();
      });
      if (mounted) unlisteners.push(u1);

      const u2 = await listen("menu-open", () => {
        if (!mounted) return;
        openFileRef.current();
      });
      if (mounted) unlisteners.push(u2);

      const u3 = await listen("menu-save", () => {
        if (!mounted) return;
        saveFileRef.current();
      });
      if (mounted) unlisteners.push(u3);

      const u4 = await listen("menu-save-as", () => {
        if (!mounted) return;
        saveFileAsRef.current();
      });
      if (mounted) unlisteners.push(u4);

      const u5 = await listen("menu-undo", () => {
        if (!mounted) return;
        undoControls.undo();
      });
      if (mounted) unlisteners.push(u5);

      const u6 = await listen("menu-redo", () => {
        if (!mounted) return;
        undoControls.redo();
      });
      if (mounted) unlisteners.push(u6);
    };

    setupListeners();

    return () => {
      mounted = false;
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [undoControls]);

  const value: AnimatorContextType = {
    // File
    newFile,
    openFile,
    saveFile,
    saveFileAs,
    filePath,
    isDirty,

    // Spritesheets
    spritesheets: animationFile.spritesheets,
    spritesheetImages,
    selectedSpritesheetId,
    addSpritesheet,
    removeSpritesheet,
    updateSpritesheet,
    reorderSpritesheets,
    selectSpritesheet,
    getSpritesheetForKey,

    // Animations
    animations: animationFile.animations,
    selectedAnimationId,
    selectedAnimation,
    selectAnimation,
    addAnimation,
    removeAnimation,
    updateAnimation,
    duplicateAnimation,
    reorderAnimations,

    // Tracks
    addTrack,
    removeTrack,
    renameTrack,
    reorderTracks,

    // Keys
    addKey,
    removeKey,
    updateKey,

    // Selection
    selection,
    setSelection,

    // Playback
    playback,
    play,
    pause,
    stop,
    setCurrentTime,

    // Timeline
    timeline,
    setTimelineZoom,
    setTimelineScroll,
    setSnapToGrid,
    setGridSize,

    // Undo/Redo
    undo: undoControls.undo,
    redo: undoControls.redo,
    canUndo: undoControls.canUndo,
    canRedo: undoControls.canRedo,
    startBatch: undoControls.startBatch,
    endBatch: undoControls.endBatch,
  };

  return (
    <AnimatorContext.Provider value={value}>
      {children}
    </AnimatorContext.Provider>
  );
}
