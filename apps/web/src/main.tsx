import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "@/App";
import { queryClient } from "@/queries/queryClient";
import { useTheme } from "@/hooks/useTheme";
import { useAuthBootstrap } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useRealtimeDataSync } from "@/hooks/useRealtimeDataSync";
import { ToastHost } from "@/components/ui/Toast";
import "@/styles.css";

async function removeStaleServiceWorkersOnce() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const cleanupKey = "campuslab_sw_cleanup_v2";
  if (window.localStorage.getItem(cleanupKey) === "1") {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } finally {
    window.localStorage.setItem(cleanupKey, "1");
  }
}

void removeStaleServiceWorkersOnce();

function Bootstrap() {
  useTheme();
  useAuthBootstrap();
  useOfflineSync();
  useRealtimeDataSync();
  return (
    <>
      <App />
      <ToastHost />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Bootstrap />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
