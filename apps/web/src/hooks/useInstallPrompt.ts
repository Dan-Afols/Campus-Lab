import { useEffect, useMemo, useState } from "react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "campuslab_install_dismissed_at";

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - dismissedAt < sevenDays) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as DeferredInstallPrompt);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const api = useMemo(() => {
    if (!deferredPrompt) {
      return null;
    }

    return {
      async install() {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      },
      dismiss() {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setDeferredPrompt(null);
      }
    };
  }, [deferredPrompt]);

  return api;
}
