import { useState } from "react";
import api from "@/services/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0)));
}

export function usePushNotifications() {
  const [status, setStatus] = useState<"idle" | "pending" | "enabled" | "denied" | "error">("idle");

  const subscribe = async () => {
    try {
      setStatus("pending");
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      await api.post("/push/subscribe", { subscription });
      setStatus("enabled");
    } catch {
      setStatus("error");
    }
  };

  return { subscribe, status };
}
