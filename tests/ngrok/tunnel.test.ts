import { describe, expect, test } from "vitest";

const NGROK_URL = process.env.NGROK_URL;

describe("ngrok tunnel", () => {
  (NGROK_URL ? test : test.skip)("exposes public health and config endpoints", async () => {
    const health = await fetch(`${NGROK_URL}/api/v1/health`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    });

    expect(health.status).toBe(200);
    const healthBody = await health.json();
    expect(healthBody.status).toBeTruthy();

    const config = await fetch(`${NGROK_URL}/api/config`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    });

    expect(config.status).toBe(200);
    const configBody = await config.json();
    expect(configBody.apiUrl).toBeTruthy();
  });
});