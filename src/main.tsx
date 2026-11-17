import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Capacitor } from "@capacitor/core";

if (
  !Capacitor.isNativePlatform() &&
  import.meta.env.PROD &&
  "serviceWorker" in navigator
) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("./sw.js")
      .catch(() =>
        console.warn(
          "Offline installation unavailable. The app can still run online.",
        ),
      );
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
