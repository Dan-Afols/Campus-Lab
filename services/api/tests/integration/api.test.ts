import { describe, expect, test } from "vitest";

const API_URL = process.env.API_URL || "http://localhost:4000";
const TEST_ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN;

async function fetchJson(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, init);
  const body = await response.json().catch(() => null);
  return { response, body };
}

describe("Campus Lab API integration", () => {
  test("public health endpoint reports live status", async () => {
    const { response, body } = await fetchJson("/api/v1/health");
    expect(response.status).toBe(200);
    expect(body.status).toBeTruthy();
    expect(body.database).toBeTruthy();
    expect(body.redis).toBeTruthy();
    expect(body.aiServer).toBeTruthy();
  });

  test("config endpoint returns an API URL", async () => {
    const { response, body } = await fetchJson("/api/config");
    expect(response.status).toBe(200);
    expect(body.apiUrl).toBeTruthy();
  });

  test("protected routes reject anonymous requests", async () => {
    const { response } = await fetchJson("/api/v1/users/me");
    expect(response.status).toBe(401);
  });

  (TEST_ACCESS_TOKEN ? test : test.skip)("authenticated user can reach profile data", async () => {
    const { response, body } = await fetchJson("/api/v1/users/me", {
      headers: { Authorization: `Bearer ${TEST_ACCESS_TOKEN}` }
    });

    expect(response.status).toBe(200);
    expect(body?.email).toBeTruthy();
  });
});