import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import App from "./App";
import { ToastProvider } from "./components/toast";
import { I18nProvider } from "./i18n";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <I18nProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </I18nProvider>
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>,
);
