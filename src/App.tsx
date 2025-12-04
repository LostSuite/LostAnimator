import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { UndoRedoProvider } from "./context/UndoRedoContext";
import { AnimatorProvider } from "./context/AnimatorContext";
import { AppLayout } from "./components/layout/AppLayout";
import { checkForUpdates } from "./utils/updater";

function App() {
  useEffect(() => {
    let mounted = true;
    const unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      // Listen for check updates menu event
      const unlisten = await listen("menu-check-updates", async () => {
        if (!mounted) return;
        await checkForUpdates();
      });
      if (mounted) unlisteners.push(unlisten);

      // Auto-check for updates on startup (silently)
      setTimeout(() => {
        if (mounted) {
          checkForUpdates(false).catch(console.error);
        }
      }, 5000);
    };

    setupListeners();

    return () => {
      mounted = false;
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, []);

  return (
    <UndoRedoProvider>
      <AnimatorProvider>
        <AppLayout />
      </AnimatorProvider>
    </UndoRedoProvider>
  );
}

export default App;
