import { create } from "zustand";

type OfflineAction = {
  id: string;
  url: string;
  method: "POST" | "PATCH";
  payload: unknown;
  createdAt: number;
};

type OfflineQueueState = {
  queue: OfflineAction[];
  enqueue: (action: OfflineAction) => void;
  dequeue: (id: string) => void;
  clear: () => void;
};

export const useOfflineQueueStore = create<OfflineQueueState>((set) => ({
  queue: [],
  enqueue: (action) => set((state) => ({ queue: [...state.queue, action] })),
  dequeue: (id) => set((state) => ({ queue: state.queue.filter((a) => a.id !== id) })),
  clear: () => set({ queue: [] })
}));
