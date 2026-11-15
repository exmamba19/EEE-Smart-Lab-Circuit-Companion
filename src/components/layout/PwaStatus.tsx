"use client";

import { Download, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/** Chrome/Edge/Android fire this before showing their own install UI. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Header widget: shows an "Offline" badge when the network drops and an
 * "Install" button when the browser reports the app as installable.
 */
export default function PwaStatus() {
  const [online, setOnline] = useState(true);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => undefined);
    setInstallEvent(null);
  };

  return (
    <>
      {!online && (
        <span
          role="status"
          className="chip gap-1 border-amber-400/50 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          title="No connection — all tools keep working from the offline cache"
        >
          <WifiOff className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Offline</span>
        </span>
      )}
      {installEvent && (
        <button type="button" onClick={install} className="btn btn-secondary px-2.5 py-1.5 text-xs" title="Install as an app">
          <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Install</span>
        </button>
      )}
    </>
  );
}
