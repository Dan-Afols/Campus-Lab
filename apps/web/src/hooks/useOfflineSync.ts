import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import { useOfflineQueueStore } from "@/stores/offlineQueueStore";

export function useOfflineSync() {
  const { queue, dequeue } = useOfflineQueueStore();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!online || queue.length === 0) {
      return;
    }

    let cancelled = false;

    const flush = async () => {
      toast.loading(`Syncing ${queue.length} offline actions...`, { id: "sync" });
      for (const action of queue) {
        if (cancelled) {
          return;
        }
        await api.request({
          url: action.url,
          method: action.method,
          data: action.payload
        });
        dequeue(action.id);
      }
      toast.success("All offline actions synced", { id: "sync" });
    };

    void flush();

    return () => {
      cancelled = true;
    };
  }, [online, queue, dequeue]);

  return { online };
}
