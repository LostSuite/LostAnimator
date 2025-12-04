import { UndoRedoProvider } from "./context/UndoRedoContext";
import { AnimatorProvider } from "./context/AnimatorContext";
import { AppLayout } from "./components/layout/AppLayout";

function App() {
  return (
    <UndoRedoProvider>
      <AnimatorProvider>
        <AppLayout />
      </AnimatorProvider>
    </UndoRedoProvider>
  );
}

export default App;
