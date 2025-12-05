import { open } from "@tauri-apps/plugin-dialog";

export interface BrokenReference {
  spritesheetId: string;
  spritesheetName: string;
  originalPath: string;
}

interface BrokenReferencesModalProps {
  brokenReferences: BrokenReference[];
  onRelocate: (spritesheetId: string, newPath: string) => void;
  onClose: () => void;
}

export function BrokenReferencesModal({
  brokenReferences,
  onRelocate,
  onClose,
}: BrokenReferencesModalProps) {
  const handleLocate = async (ref: BrokenReference) => {
    const selected = await open({
      title: `Locate "${ref.spritesheetName}"`,
      filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }],
    });

    if (selected) {
      onRelocate(ref.spritesheetId, selected);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-700 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-sm font-medium text-zinc-200">Missing References</h2>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-xs text-zinc-400 mb-4">
            The following spritesheets could not be found. Click "Locate" to specify their new location.
          </p>

          <div className="space-y-2">
            {brokenReferences.map((ref) => (
              <div
                key={ref.spritesheetId}
                className="bg-zinc-900/50 border border-zinc-700/50 rounded p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-zinc-200 truncate">
                      {ref.spritesheetName}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5" title={ref.originalPath}>
                      {ref.originalPath}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLocate(ref)}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex-shrink-0"
                  >
                    Locate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
