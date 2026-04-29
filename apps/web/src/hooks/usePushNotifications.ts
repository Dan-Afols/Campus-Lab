import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { registerFCMToken } from "@/lib/firebase";
import toast from "react-hot-toast";

export function usePushNotifications() {
  const [status, setStatus] = useState<"idle" | "pending" | "enabled" | "denied" | "error">("idle");
  const { hydrated, accessToken } = useAuthStore();

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setStatus("pending");

        // Register service worker for Firebase messaging
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
            console.log('Firebase messaging service worker registered');
          } catch (error) {
            console.warn('Failed to register firebase messaging service worker:', error);
          }
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            if (mounted) {
              setStatus('denied');
            }
            return;
          }
        }

        // Register FCM token with backend
        const token = await registerFCMToken();
        
        if (mounted) {
          if (token) {
            setStatus('enabled');
          } else if (Notification.permission === 'granted') {
            // Token registration failed but permission is granted
            setStatus('enabled');
          } else {
            setStatus('denied');
          }
        }
      } catch (error) {
        console.error('Push notification setup error:', error);
        if (mounted) {
          setStatus('error');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [hydrated, accessToken]);

  const subscribe = async () => {
    try {
      setStatus("pending");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      // Register token with backend
      const token = await registerFCMToken();
      if (token) {
        setStatus("enabled");
        toast.success("Notifications enabled");
      } else {
        setStatus("enabled"); // Still mark as enabled even if token fetch fails
        toast.success("Notifications enabled");
      }
    } catch (error) {
      console.error("Push subscription error:", error);
      setStatus("error");
      toast.error("Failed to enable notifications");
    }
  };

  return { subscribe, status };
}
