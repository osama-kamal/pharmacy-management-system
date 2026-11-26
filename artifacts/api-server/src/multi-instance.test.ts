import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Two separate server processes share one database, like two serverless
 * instances would. Always runs against the local SQLite file backend; runs
 * against a remote libSQL (Turso) test database when TEST_LIBSQL_URL is set.
 */
const apiDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN_PASSWORD = "Test-only-" + Math.random().toString(36).slice(2);

type Instance = { child: ChildProcess; base: string };

async function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function startInstance(env: Record<string, string>): Promise<Instance> {
  const port = await freePort();
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "src/index.ts"],
    {
      cwd: apiDir,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(port),
        LOG_LEVEL: process.env.TEST_LOGS ? "error" : "silent",
        ADMIN_PASSWORD,
        ...env,
      },
      stdio: process.env.TEST_LOGS ? "inherit" : "ignore",
    },
  );
  return { child, base: `http://127.0.0.1:${port}/api` };
}

async function waitReady(instance: Instance) {
  for (let i = 0; i < 100; i += 1) {
    try {
      const response = await fetch(`${instance.base}/healthz`);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("instance did not start");
}

async function call(
  instance: Instance,
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {},
) {
  const response = await fetch(`${instance.base}${path}`, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: {
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body, headers: response.headers };
}

async function login(instance: Instance) {
  const result = await call(instance, "/auth/login", {
    body: { email: "admin@pharmacy.local", password: ADMIN_PASSWORD },
  });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return result.headers.get("set-cookie")!.split(";")[0]!;
}

// The libSQL variant needs a REMOTE test database (TEST_LIBSQL_URL and
// TEST_LIBSQL_TOKEN, an empty database used only for tests). A local file
// shared by two processes is not a faithful stand-in: file locking, not the
// application, decides the outcome there.
const backends = ["sqlite file", ...(process.env["TEST_LIBSQL_URL"] ? ["libsql"] : [])] as const;
for (const backend of backends) {
  describe(`two instances sharing one ${backend} database`, () => {
    let dir = "";
    let a: Instance;
    let b: Instance;

    before(async () => {
      dir = mkdtempSync(join(tmpdir(), "pharmacy-multi-"));
      const env: Record<string, string> =
        backend === "libsql"
          ? {
              TURSO_DATABASE_URL: process.env["TEST_LIBSQL_URL"]!,
              TURSO_AUTH_TOKEN: process.env["TEST_LIBSQL_TOKEN"] ?? "",
            }
          : { PHARMACY_DATA_DIR: dir };
      // Both start at the same moment on an empty database (seed race).
      [a, b] = await Promise.all([startInstance(env), startInstance(env)]);
      await Promise.all([waitReady(a), waitReady(b)]);
    });

    after(() => {
      a?.child.kill();
      b?.child.kill();
      rmSync(dir, { recursive: true, force: true });
    });

    test("seed race leaves one consistent admin user that works on both", async () => {
      const cookieA = await login(a);
      const cookieB = await login(b);
      const users = await call(a, "/users", { cookie: cookieA });
      assert.equal(users.status, 200);
      assert.equal(
        users.body.filter((user: any) => user.email === "admin@pharmacy.local")
          .length,
        1,
      );
      const meB = await call(b, "/auth/me", { cookie: cookieB });
      assert.equal(meB.body.user.email, "admin@pharmacy.local");
    });

    test("a session created on one instance works on the other and logout ends it everywhere", async () => {
      const cookie = await login(a);
      const onB = await call(b, "/auth/me", { cookie });
      assert.equal(onB.body.user?.email, "admin@pharmacy.local");
      const products = await call(b, "/products", { cookie });
      assert.equal(products.status, 200);
      const logout = await call(b, "/auth/logout", {
        method: "POST",
        cookie,
      });
      assert.equal(logout.status, 204);
      const afterOnA = await call(a, "/auth/me", { cookie });
      assert.equal(afterOnA.body.user, null);
      const blocked = await call(a, "/products", { cookie });
      assert.equal(blocked.status, 401);
    });

    test("25 parallel checkouts on one instance lose nothing", async () => {
      const cookie = await login(a);
      const before = (await call(a, "/products", { cookie })).body[0];
      const sales = (await call(a, "/sales", { cookie })).body.length;
      const results = await Promise.all(
        Array.from({ length: 25 }, () =>
          call(a, "/pos/checkout", {
            cookie,
            body: {
              customer: "Parallel",
              paymentMethod: "Cash",
              items: [{ productId: before.id, quantity: 1 }],
            },
          }),
        ),
      );
      assert(results.every((r) => r.status === 201), JSON.stringify(results.map((r) => r.status)));
      const receipts = new Set(results.map((r) => r.body.receiptNumber));
      assert.equal(receipts.size, 25);
      const after = (await call(b, "/products", { cookie })).body.find(
        (p: any) => p.id === before.id,
      );
      assert.equal(after.stock, before.stock - 25);
      const salesAfter = (await call(b, "/sales", { cookie })).body.length;
      assert.equal(salesAfter, sales + 25);
    });

    test("40 interleaved checkouts across both instances: every success is stored exactly once", async () => {
      const cookie = await login(a);
      const before = (await call(a, "/products", { cookie })).body.sort((x: any, y: any) => y.stock - x.stock)[0];
      assert(before.stock >= 60, "needs a well stocked product");
      const sales = (await call(a, "/sales", { cookie })).body.length;
      const results = await Promise.all(
        Array.from({ length: 40 }, (_, index) =>
          call(index % 2 ? a : b, "/pos/checkout", {
            cookie,
            body: {
              customer: "Interleaved",
              paymentMethod: "Cash",
              items: [{ productId: before.id, quantity: 1 }],
            },
          }),
        ),
      );
      const okCount = results.filter((r) => r.status === 201).length;
      for (const r of results) {
        // Either stored, or refused with a clear conflict. Never a false success.
        assert([201, 409].includes(r.status), `unexpected status ${r.status}`);
      }
      assert(okCount >= 1);
      const receipts = new Set(
        results.filter((r) => r.status === 201).map((r) => r.body.receiptNumber),
      );
      assert.equal(receipts.size, okCount);
      const after = (await call(b, "/products", { cookie })).body.find(
        (p: any) => p.id === before.id,
      );
      assert.equal(after.stock, before.stock - okCount);
      assert.equal(
        (await call(a, "/sales", { cookie })).body.length,
        sales + okCount,
      );
      console.log(`  [${backend}] interleaved: ${okCount}/40 committed, ${40 - okCount} asked to retry`);
    });

    test("logins and sales in parallel do not overwrite each other", async () => {
      const cookie = await login(a);
      const product = (await call(a, "/products", { cookie })).body[2];
      const jobs = [
        ...Array.from({ length: 8 }, (_, i) => ({ kind: "login", on: i % 2 ? a : b })),
        ...Array.from({ length: 8 }, (_, i) => ({ kind: "sale", on: i % 2 ? b : a })),
      ];
      const results = await Promise.all(
        jobs.map(async (job) =>
          job.kind === "login"
            ? { job, result: await call(job.on, "/auth/login", { body: { email: "admin@pharmacy.local", password: ADMIN_PASSWORD } }) }
            : { job, result: await call(job.on, "/pos/checkout", { cookie, body: { customer: "Mixed", paymentMethod: "Cash", items: [{ productId: product.id, quantity: 1 }] } }) },
        ),
      );
      const logins = results.filter((r) => r.job.kind === "login" && r.result.status === 200);
      const sales = results.filter((r) => r.job.kind === "sale" && r.result.status === 201);
      for (const r of results) assert([200, 201, 409].includes(r.result.status));
      // every login that reported success has a session that still works
      for (const r of logins) {
        const sessionCookie = r.result.headers.get("set-cookie")!.split(";")[0]!;
        const me = await call(b, "/auth/me", { cookie: sessionCookie });
        assert.equal(me.body.user?.email, "admin@pharmacy.local");
      }
      const after = (await call(a, "/products", { cookie })).body.find((p: any) => p.id === product.id);
      assert.equal(after.stock, product.stock - sales.length);
    });
  });
}
