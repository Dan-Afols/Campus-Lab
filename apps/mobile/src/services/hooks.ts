import { useEffect, useState } from "react";
import { api } from "./api";

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useApiQuery<T>(path: string) {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let mounted = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    api
      .get<T>(path)
      .then((res) => {
        if (!mounted) {
          return;
        }
        setState({ data: res.data, loading: false, error: null });
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setState({ data: null, loading: false, error: err?.message ?? "Request failed" });
      });

    return () => {
      mounted = false;
    };
  }, [path]);

  return state;
}