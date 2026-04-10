import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive-buttons.css";
import "./styles/responsive-typography.css";
import "./styles/smart-tv.css";
import { initializeNavigation } from "./lib/navigation";
import { FocusProvider } from "./contexts/FocusContext";

// Inicializar sistema de navegação
initializeNavigation();

createRoot(document.getElementById("root")!).render(
  <FocusProvider>
    <App />
  </FocusProvider>
);
