import type { Response } from "express";

export type RealtimeChannel = "news" | "materials" | "past-questions" | "timetable" | "notifications";

export type RealtimePayload = {
  channel: RealtimeChannel;
  action: "created" | "updated" | "deleted";
  entityId?: string;
  at: string;
};

const clients = new Map<number, Response>();
let nextClientId = 1;

export function addRealtimeClient(res: Response) {
  const id = nextClientId++;
  clients.set(id, res);
  return () => {
    clients.delete(id);
  };
}

export function emitRealtimeEvent(payload: Omit<RealtimePayload, "at">) {
  const message: RealtimePayload = {
    ...payload,
    at: new Date().toISOString()
  };

  const encoded = `data: ${JSON.stringify(message)}\n\n`;
  for (const [clientId, client] of clients.entries()) {
    try {
      client.write(encoded);
    } catch {
      clients.delete(clientId);
    }
  }
}
