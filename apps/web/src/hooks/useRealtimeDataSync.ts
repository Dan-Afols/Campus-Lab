import { useEffect } from "react";
import { queryClient } from "@/queries/queryClient";
import { useAuthStore } from "@/stores/authStore";

type RealtimeEvent = {
  channel: "news" | "materials" | "past-questions";
  action: "created" | "updated" | "deleted";
  entityId?: string;
  at: string;
  bootstrap?: boolean;
};

function resolveApiBaseUrl(rawBase: string) {
  if (!rawBase.startsWith("http")) {
    return rawBase;
  }

  try {
    const url = new URL(rawBase);
    const isLoopbackTarget = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const currentHost = window.location.hostname;
    const isCurrentLoopback = currentHost === "localhost" || currentHost === "127.0.0.1";

    if (isLoopbackTarget && !isCurrentLoopback) {
      url.hostname = currentHost;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return rawBase;
  }
}

function buildRealtimeUrl(accessToken: string) {
  const base = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
  const streamPath = `${base}/realtime/stream`;
  const absolute = streamPath.startsWith("http") ? streamPath : `${window.location.origin}${streamPath}`;
  const url = new URL(absolute);
  url.searchParams.set("token", accessToken);
  return url.toString();
}

export function useRealtimeDataSync() {
  const { hydrated, accessToken } = useAuthStore();

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    const source = new EventSource(buildRealtimeUrl(accessToken));

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RealtimeEvent;
        if (payload.bootstrap) {
          return;
        }

        if (payload.channel === "news") {
          void queryClient.invalidateQueries({ queryKey: ["news"] });
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }

        if (payload.channel === "materials") {
          void queryClient.invalidateQueries({ queryKey: ["materials"] });
        }

        if (payload.channel === "past-questions") {
          void queryClient.invalidateQueries({ queryKey: ["pastQuestions"] });
        }
      } catch {
        // Ignore malformed realtime event payloads.
      }
    };

    return () => {
      source.close();
    };
  }, [hydrated, accessToken]);
}
