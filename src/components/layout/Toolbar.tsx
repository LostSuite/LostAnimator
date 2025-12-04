import { useAnimator } from "../../context/AnimatorContext";

export function Toolbar() {
  const { filePath, isDirty } = useAnimator();

  const fileName = filePath ? filePath.split("/").pop() : "Untitled";

  return (
    <div
      data-tauri-drag-region
      className="h-8 flex-shrink-0 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center justify-center px-4"
    >
      <div className="text-sm text-zinc-300 font-medium">
        {fileName}
        {isDirty && <span className="text-amber-400 ml-1">*</span>}
      </div>
    </div>
  );
}
