import { describe, expect, test } from "vitest";

const API_URL = process.env.API_URL || "http://localhost:4000";

describe("SSE connectivity", () => {
  test("config stream responds with event-stream data", async () => {
    const response = await fetch(`${API_URL}/api/config/stream`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const reader = response.body?.getReader();
    expect(reader).toBeTruthy();
    const chunk = await reader!.read();
    const text = new TextDecoder().decode(chunk.value);
    expect(text).toContain("data:");
    reader!.cancel();
  });
});