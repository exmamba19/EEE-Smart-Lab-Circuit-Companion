"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Platform glue that runs once on the client:
 * - Web / PWA: registers the offline service worker (production builds only).
 * - Native Android (Capacitor): assets are already bundled on the device, so no service worker;
 *   instead the hardware back button navigates back through history and exits at the root.
 */
export default function NativeBridge() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let remove: (() => void) | undefined;
      void import("@capacitor/app").then(({ App }) =>
        App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else void App.exitApp();
        }).then((handle) => {
          remove = () => void handle.remove();
        }),
      );
      return () => remove?.();
    }

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* registration failures only disable offline support */
      });
    }
  }, []);

  return null;
}
