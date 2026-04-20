import { openDB } from "idb";

type QueuedAction = {
  id: string;
  url: string;
  method: "POST" | "PATCH";
  payload: unknown;
  createdAt: number;
};

const dbPromise = openDB("campuslab-offline", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("queue")) {
      db.createObjectStore("queue", { keyPath: "id" });
    }
  }
});

export async function queueOfflineAction(action: QueuedAction) {
  const db = await dbPromise;
  await db.put("queue", action);
}

export async function readOfflineActions() {
  const db = await dbPromise;
  return db.getAll("queue") as Promise<QueuedAction[]>;
}

export async function removeOfflineAction(id: string) {
  const db = await dbPromise;
  await db.delete("queue", id);
}
