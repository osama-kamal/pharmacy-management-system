import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type {
  CommitResult,
  DocumentChange,
  StorageBackend,
  StoredRow,
} from "./lib/storage";

/** In-memory backend with the same compare-and-set rules plus fault switches. */
class FakeBackend implements StorageBackend {
  readonly description = "fake";
  rows = new Map<string, { value: string; version: number }>();
  mode: "ok" | "throw" | "conflict-always" | "conflict-once" = "ok";
  commitCalls = 0;
  async ensure(defaults: { key: string; value: string }[]) {
    for (const item of defaults)
      if (!this.rows.has(item.key))
        this.rows.set(item.key, { value: item.value, version: 1 });
  }
  async loadKeys(keys: string[]): Promise<StoredRow[]> {
    return keys.flatMap((key) => {
      const row = this.rows.get(key);
      return row ? [{ key, ...row }] : [];
    });
  }
  async createSandbox(): Promise<never> {
    throw new Error("not used in these tests");
  }
  async commit(changes: DocumentChange[]): Promise<CommitResult> {
    this.commitCalls += 1;
    if (this.mode === "throw") throw new Error("database unavailable");
    if (this.mode === "conflict-always")
      return { ok: false, conflictKey: changes[0]!.key };
    if (this.mode === "conflict-once") {
      this.mode = "ok";
      return { ok: false, conflictKey: changes[0]!.key };
    }
    for (const change of changes)
      if (this.rows.get(change.key)?.version !== change.expectedVersion)
        return { ok: false, conflictKey: change.key };
    for (const change of changes)
      this.rows.set(change.key, {
        value: change.value,
        version: change.expectedVersion + 1,
      });
    return { ok: true };
  }
}

const backend = new FakeBackend();
let server: Server;
let base = "";
let cookie = "";

async function call(path: string, body?: unknown, useCookie = true) {
  const response = await fetch(`${base}/api${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(useCookie && cookie ? { cookie } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
    setCookie: response.headers.get("set-cookie"),
  };
}

before(async () => {
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "silent";
  process.env.ADMIN_PASSWORD = "fault-test-password";
  const { persistence } = await import("./lib/persistent-json");
  await persistence.useBackend(backend);
  const { default: app } = await import("./app");
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      base = `http://127.0.0.1:${(server.address() as any).port}`;
      resolve();
    });
  });
  const login = await call(
    "/auth/login",
    { email: "admin@pharmacy.local", password: "fault-test-password" },
    false,
  );
  assert.equal(login.status, 200);
  cookie = login.setCookie!.split(";")[0]!;
});

after(() => server.close());

const checkout = (productId: number) =>
  call("/pos/checkout", {
    customer: "Fault",
    paymentMethod: "Cash",
    items: [{ productId, quantity: 1 }],
  });
const stockOf = async (id: number) =>
  ((await call("/products")).body as any[]).find((p) => p.id === id).stock;

test("a failed write returns an error and stores nothing", async () => {
  const product = ((await call("/products")).body as any[])[0];
  backend.mode = "throw";
  const result = await checkout(product.id);
  assert.equal(result.status, 500);
  assert.match(result.body.error, /Nothing was changed/);
  backend.mode = "ok";
  assert.equal(await stockOf(product.id), product.stock);
});

test("a refused write after every retry returns 409 and stores nothing", async () => {
  const product = ((await call("/products")).body as any[])[0];
  backend.mode = "conflict-always";
  backend.commitCalls = 0;
  const result = await checkout(product.id);
  assert.equal(result.status, 409);
  assert(backend.commitCalls > 1, "it retried before giving up");
  backend.mode = "ok";
  assert.equal(await stockOf(product.id), product.stock);
});

test("one conflict is retried on fresh data and applied exactly once", async () => {
  const product = ((await call("/products")).body as any[])[0];
  backend.mode = "conflict-once";
  const result = await checkout(product.id);
  assert.equal(result.status, 201);
  assert.equal(await stockOf(product.id), product.stock - 1);
});

test("a login whose session could not be stored sends no session cookie", async () => {
  backend.mode = "throw";
  const result = await call(
    "/auth/login",
    { email: "admin@pharmacy.local", password: "fault-test-password" },
    false,
  );
  assert.equal(result.status, 500);
  assert.equal(result.setCookie, null);
  backend.mode = "ok";
});

test("a write made by someone else in between is never overwritten", async () => {
  // Simulate another instance committing between our read and our write.
  const product = ((await call("/products")).body as any[])[0];
  const original = backend.commit.bind(backend);
  let intruded = false;
  backend.commit = async (changes) => {
    if (!intruded) {
      intruded = true;
      const row = backend.rows.get("pharmacy-data.json")!;
      const data = JSON.parse(row.value);
      data.products.find((p: any) => p.id === product.id).stock += 100;
      backend.rows.set("pharmacy-data.json", {
        value: JSON.stringify(data),
        version: row.version + 1,
      });
    }
    return original(changes);
  };
  const result = await checkout(product.id);
  backend.commit = original;
  assert.equal(result.status, 201);
  // their +100 and our -1 are both present
  assert.equal(await stockOf(product.id), product.stock + 100 - 1);
});

test("requests that only read never write", async () => {
  backend.commitCalls = 0;
  await call("/products");
  await call("/auth/me");
  assert.equal(backend.commitCalls, 0);
});
