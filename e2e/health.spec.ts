import { expect, test } from "@playwright/test";

test("answers GET /api/health with ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/json");
  expect(await response.json()).toEqual({ ok: true });
});

test("refuses POST /api/health with 405 and allows only GET", async ({ request }) => {
  const response = await request.post("/api/health");

  expect(response.status()).toBe(405);
  expect(response.headers()["allow"]).toBe("GET");
});

test("stores a voice note posted to /api/notes and answers its size", async ({ request }) => {
  const note = "made-up voice note";
  const response = await request.post("/api/notes", { data: note, headers: { "content-type": "text/plain" } });

  expect(response.status()).toBe(201);
  const body: { id: number; bytes: number } = await response.json();
  expect(Number.isInteger(body.id) && body.id > 0).toBe(true);
  expect(body.bytes).toBe(Buffer.byteLength(note));
});

test("refuses GET /api/notes with 405 and allows only POST", async ({ request }) => {
  const response = await request.get("/api/notes");

  expect(response.status()).toBe(405);
  expect(response.headers()["allow"]).toBe("POST");
});
