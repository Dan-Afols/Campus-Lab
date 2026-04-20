import { describe, expect, test } from "vitest";

const wsUrl = process.env.WS_URL;

describe("WebSocket connectivity", () => {
  (wsUrl ? test : test.skip)("opens a websocket connection when WS_URL is configured", async () => {
    const socket = new WebSocket(wsUrl as string);

    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => {
        socket.close();
        resolve();
      };
      socket.onerror = () => reject(new Error("WebSocket failed to open"));
    });

    expect(socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING).toBe(true);
  });
});