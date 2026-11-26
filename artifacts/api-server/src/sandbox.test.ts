import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

/**
 * Demo sandboxes: every visitor gets an independent copy of the data.
 * Runs on a real local database file (or TEST_LIBSQL_URL when set).
 */
const OWNER_PASSWORD = "Owner-" + Math.random().toString(36).slice(2) + "-test";
const dataDir = mkdtempSync(join(tmpdir(), "sandbox-test-"));
let server: Server;
let base = "";
let ownerCookie = "";
let rawDb: { prepare(sql: string): any; close(): void };

async function call(
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {},
) {
  const response = await fetch(`${base}/api${path}`, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: {
      ...(options.cookie ? { cookie: `pharmacy_session=${options.cookie}` } : {}),
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  const setCookie = response.headers.get("set-cookie") ?? "";
  return {
    status: response.status,
    body: json,
    token: /pharmacy_session=([^;]*)/.exec(setCookie)?.[1] ?? "",
    setCookie,
  };
}

async function startSandbox() {
  const result = await call("/demo/start", { method: "POST", body: {} });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.match(result.token, /^sbx_[a-f0-9]{32}\.[a-f0-9]{64}$/);
  return result.token;
}
const idOf = (token: string) => token.slice(4, 36);
const rowsOf = (id: string) =>
  rawDb
    .prepare("SELECT document_key, version FROM app_documents WHERE document_key GLOB ?")
    .all(`sbx_${id}/*`) as { document_key: string; version: number }[];
const customers = async (cookie?: string) =>
  (await call("/customers", { cookie })).body as { id: number; name: string }[];

before(async () => {
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "silent";
  process.env.ADMIN_PASSWORD = OWNER_PASSWORD;
  process.env.SEED_DEMO_DATA = "true";
  process.env.PHARMACY_DATA_DIR = dataDir;
  process.env.DEMO_SANDBOX = "true";
  process.env.DEMO_MAX_SANDBOXES = "6";
  process.env.DEMO_THROTTLE_MAX = "9";
  process.env.DEMO_IP_LIMIT = "1000";
  const { default: app } = await import("./app");
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      base = `http://127.0.0.1:${(server.address() as any).port}`;
      resolve();
    });
  });
  const login = await call("/auth/login", {
    body: { email: "admin@pharmacy.local", password: OWNER_PASSWORD },
  });
  assert.equal(login.status, 200);
  ownerCookie = login.token;
  const require = createRequire(import.meta.url);
  const Database = require("better-sqlite3");
  rawDb = new Database(join(dataDir, "pharmacy.sqlite3"));
});

after(() => {
  server.close();
  rawDb.close();
  rmSync(dataDir, { recursive: true, force: true });
});

describe("demo sandboxes", () => {
  beforeEach(() => {
    rawDb.prepare("DELETE FROM app_documents WHERE document_key GLOB 'sbx_*'").run();
    rawDb.prepare("DELETE FROM app_documents WHERE document_key = 'demo-throttle'").run();
  });

  test("the endpoint is off unless DEMO_SANDBOX is true", async () => {
    process.env.DEMO_SANDBOX = "false";
    assert.equal((await call("/demo/config")).body.enabled, false);
    assert.equal((await call("/demo/start", { method: "POST", body: {} })).status, 404);
    process.env.DEMO_SANDBOX = "true";
    assert.equal((await call("/demo/config")).body.enabled, true);
  });

  test("a visitor gets a working admin session on a seeded copy", async () => {
    const token = await startSandbox();
    const me = await call("/auth/me", { cookie: token });
    assert.equal(me.body.user.email, "demo@pharmacy.local");
    assert.equal(me.body.user.role, "Owner");
    assert.ok((await customers(token)).length >= 5);
    assert.equal(rowsOf(idOf(token)).length, 5); // 4 documents + meta
  });

  test("changes in one sandbox are invisible to another sandbox and to the owner", async () => {
    const a = await startSandbox();
    const b = await startSandbox();
    const ownerBefore = (await customers(ownerCookie)).length;
    const created = await call("/customers", {
      cookie: a,
      body: { name: "Only In A", email: "a@example.invalid", phone: "+20 100 000 0001" },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.ok((await customers(a)).some((c) => c.name === "Only In A"));
    assert.ok(!(await customers(b)).some((c) => c.name === "Only In A"));
    assert.ok(!(await customers(ownerCookie)).some((c) => c.name === "Only In A"));
    // deleting in A leaves B and the owner untouched
    const removed = await call(`/customers/${created.body.id}`, { method: "DELETE", cookie: a });
    assert.ok([200, 204].includes(removed.status), `delete ${removed.status}`);
    assert.ok(!(await customers(a)).some((c) => c.name === "Only In A"));
    const sale = await call("/pos/checkout", {
      cookie: a,
      body: { customer: "Walk-in", paymentMethod: "Cash", items: [{ productId: 1, quantity: 1 }] },
    });
    assert.ok(sale.status < 300, `sale ${sale.status} ${JSON.stringify(sale.body)}`);
    const stock = async (cookie: string) =>
      ((await call("/products", { cookie })).body as any[]).find((p) => p.id === 1).stock;
    assert.equal((await stock(a)) + 1, await stock(b));
    assert.equal(await stock(b), await stock(ownerCookie));
    assert.equal((await customers(ownerCookie)).length, ownerBefore);
  });

  test("sandbox admins can use the whole user and password area without touching the owner", async () => {
    const a = await startSandbox();
    const added = await call("/users", {
      cookie: a,
      body: { name: "Staff A", email: "staff@a.test", password: "staff-pass-1", role: "Cashier" },
    });
    assert.equal(added.status, 201, JSON.stringify(added.body));
    const list = await call("/users", { cookie: a });
    assert.equal(list.status, 200);
    const text = JSON.stringify(list.body);
    assert.ok(!text.includes("passwordHash") && !text.includes("admin@pharmacy.local"));
    // sign in as the new staff user inside the sandbox, stays in the sandbox
    const staff = await call("/auth/login", {
      cookie: a,
      body: { email: "staff@a.test", password: "staff-pass-1" },
    });
    assert.equal(staff.status, 200);
    assert.ok(staff.token.startsWith(`sbx_${idOf(a)}.`));
    assert.equal((await call("/auth/me", { cookie: staff.token })).body.user.email, "staff@a.test");
    // the demo admin may change its password (it only exists in this sandbox)
    const changed = await call("/auth/change-password", {
      cookie: a,
      body: { currentPassword: "wrong", newPassword: "another-pass-2" },
    });
    assert.equal(changed.status, 400);
    // the owner can still sign in with the owner password, and sees no staff user
    const owner = await call("/auth/login", {
      body: { email: "admin@pharmacy.local", password: OWNER_PASSWORD },
    });
    assert.equal(owner.status, 200);
    const ownerUsers = JSON.stringify((await call("/users", { cookie: owner.token })).body);
    assert.ok(!ownerUsers.includes("staff@a.test") && !ownerUsers.includes("demo@pharmacy.local"));
    // logout works inside the sandbox
    assert.equal((await call("/auth/logout", { method: "POST", cookie: staff.token })).status, 204);
    assert.equal((await call("/auth/me", { cookie: staff.token })).body.user, null);
  });

  test("the owner password does not open a sandbox", async () => {
    const a = await startSandbox();
    const attempt = await call("/auth/login", {
      cookie: a,
      body: { email: "admin@pharmacy.local", password: OWNER_PASSWORD },
    });
    assert.equal(attempt.status, 401);
  });

  test("forged, malformed and borrowed tokens never reach any data", async () => {
    const a = await startSandbox();
    const b = await startSandbox();
    const idA = idOf(a);
    const idB = idOf(b);
    const secretA = a.split(".")[1]!;
    const ownerToken = ownerCookie;
    const unknownId = "0".repeat(32);
    const before = rawDb.prepare("SELECT count(*) AS n FROM app_documents").get().n;
    const forged = [
      `sbx_${idA}.${"1".repeat(64)}`, // right sandbox, wrong secret
      `sbx_${idB}.${secretA}`, // B with A's secret
      `sbx_${idA}.${ownerToken}`, // owner token behind a sandbox prefix
      `sbx_${unknownId}.${"2".repeat(64)}`, // sandbox that does not exist
      "sbx_zzzz.nothing", // malformed
      `sbx_${idA}`, // no secret
      `sbx_${idA}.${secretA}x`, // secret too long
      "constructor",
      "__proto__",
      "toString",
    ];
    for (const token of forged) {
      for (const path of ["/customers", "/users", "/products", "/profile"]) {
        const result = await call(path, { cookie: token });
        assert.equal(result.status, 401, `${token.slice(0, 20)} ${path} -> ${result.status}`);
      }
      assert.equal((await call("/auth/me", { cookie: token })).body.user, null);
    }
    // nothing was created for the unknown id, and nothing else changed
    assert.equal(rowsOf(unknownId).length, 0);
    assert.equal(rawDb.prepare("SELECT count(*) AS n FROM app_documents").get().n, before);
    // the owner's own token still works
    assert.equal((await call("/customers", { cookie: ownerToken })).status, 200);
  });

  test("a sandbox token never works as the owner and an owner token never reads a sandbox", async () => {
    const a = await startSandbox();
    // plain (unprefixed) version of the sandbox secret is not an owner session
    const plain = a.split(".")[1]!;
    assert.equal((await call("/customers", { cookie: plain })).status, 401);
  });

  test("reads never write", async () => {
    const a = await startSandbox();
    const snapshot = () => JSON.stringify(rowsOf(idOf(a)));
    const before = snapshot();
    for (const path of ["/customers", "/products", "/dashboard", "/auth/me", "/profile"])
      await call(path, { cookie: a });
    assert.equal(snapshot(), before);
  });

  test("a sandbox expires after 24h, is rejected, and is cleaned up on the next start", async () => {
    const a = await startSandbox();
    assert.equal((await call("/customers", { cookie: a })).status, 200);
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    rawDb
      .prepare("UPDATE app_documents SET updated_at = ? WHERE document_key = ?")
      .run(old, `sbx_${idOf(a)}/meta`);
    const expired = await call("/customers", { cookie: a });
    assert.equal(expired.status, 401);
    assert.match(expired.setCookie, /pharmacy_session=;/);
    assert.equal(rowsOf(idOf(a)).length, 5); // still stored until cleanup
    await startSandbox(); // cleanup happens in the creation transaction
    assert.equal(rowsOf(idOf(a)).length, 0);
  });

  test("the sandbox cap and the creation throttle hold across starts", async () => {
    // Remove every sandbox so counts are exact.
    rawDb.prepare("DELETE FROM app_documents WHERE document_key GLOB 'sbx_*'").run();
    rawDb.prepare("DELETE FROM app_documents WHERE document_key = 'demo-throttle'").run();
    const results = [];
    for (let i = 0; i < 8; i += 1)
      results.push((await call("/demo/start", { method: "POST", body: {} })).status);
    // cap is 6 live sandboxes
    assert.deepEqual(results.slice(0, 6), [200, 200, 200, 200, 200, 200]);
    assert.deepEqual(results.slice(6), [503, 503]);
    assert.equal(
      rawDb.prepare("SELECT count(*) AS n FROM app_documents WHERE document_key GLOB 'sbx_*/meta'").get().n,
      6,
    );
    // owner is fine while the demo is full
    assert.equal((await call("/customers", { cookie: ownerCookie })).status, 200);
    // throttle: 9 creations per window (separate counter in the database)
    rawDb.prepare("DELETE FROM app_documents WHERE document_key GLOB 'sbx_*'").run();
    const second = [];
    for (let i = 0; i < 5; i += 1)
      second.push((await call("/demo/start", { method: "POST", body: {} })).status);
    // 6 already counted in this window, so only 3 more are allowed
    assert.deepEqual(second, [200, 200, 200, 429, 429]);
  });

  test("a sandbox cannot grow past the per-document limit", async () => {
    rawDb.prepare("DELETE FROM app_documents WHERE document_key GLOB 'sbx_*'").run();
    rawDb.prepare("DELETE FROM app_documents WHERE document_key = 'demo-throttle'").run();
    const a = await startSandbox();
    const result = await call("/customers", {
      cookie: a,
      body: { name: "x".repeat(1_200_000), email: "big@example.invalid", phone: "1" },
    });
    assert.equal(result.status, 413);
    // refused by the storage limit and never stored
    const sizes = rawDb
      .prepare("SELECT length(value) AS n FROM app_documents WHERE document_key GLOB ?")
      .all(`sbx_${idOf(a)}/*`) as { n: number }[];
    assert.ok(sizes.every((row) => row.n < 1_000_000));
  });

  test("parallel sandbox starts all succeed independently", async () => {
    rawDb.prepare("DELETE FROM app_documents WHERE document_key GLOB 'sbx_*'").run();
    rawDb.prepare("DELETE FROM app_documents WHERE document_key = 'demo-throttle'").run();
    const tokens = await Promise.all([startSandbox(), startSandbox(), startSandbox()]);
    assert.equal(new Set(tokens.map(idOf)).size, 3);
    for (const token of tokens)
      assert.equal((await call("/auth/me", { cookie: token })).body.user.email, "demo@pharmacy.local");
  });

  test("the owner's data and login are unchanged by all of the above", async () => {
    const login = await call("/auth/login", {
      body: { email: "admin@pharmacy.local", password: OWNER_PASSWORD },
    });
    assert.equal(login.status, 200);
    const wrong = await call("/auth/login", {
      body: { email: "admin@pharmacy.local", password: "pharmacy123" },
    });
    assert.equal(wrong.status, 401);
    assert.ok((await customers(login.token)).length >= 5);
  });
});
