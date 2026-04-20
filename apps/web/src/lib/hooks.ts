import { useEffect, useState } from "react";
import { api } from "./api";

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type QueryOptions = {
  refreshMs?: number;
};

export function useApiQuery<T>(path: string, options?: QueryOptions) {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let mounted = true;
    const load = () => {
      setState((prev) => ({ data: prev.data, loading: prev.data ? false : true, error: null }));

      api
        .get<T>(path)
        .then((res) => {
          if (!mounted) return;
          setState({ data: res.data, loading: false, error: null });
        })
        .catch((err) => {
          if (!mounted) return;
          setState((prev) => ({
            data: prev.data,
            loading: false,
            error: err?.response?.data?.error || err?.response?.data?.message || err?.message || "Request failed"
          }));
        });
    };

    load();

    let intervalId: number | undefined;
    if (options?.refreshMs && options.refreshMs > 0) {
      intervalId = window.setInterval(load, options.refreshMs);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [path, options?.refreshMs]);

  return state;
}
