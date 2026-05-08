import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/global.css";
import "./styles/responsive-buttons.css";
import "./styles/responsive-typography.css";
import "./styles/smart-tv.css";
import "./styles/cinema-mode.css";
import { initializeNavigation } from "./lib/navigation";
import { FocusProvider } from "./contexts/FocusContext";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import posthog from "posthog-js";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
    environment: import.meta.env.MODE,
  });
}

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: "https://us.posthog.com",
  });
}

initializeNavigation();

const SentryApp = Sentry.withSentryRouting(App);

createRoot(document.getElementById("root")!).render(
  <FocusProvider>
    <SentryApp />
  </FocusProvider>
);
