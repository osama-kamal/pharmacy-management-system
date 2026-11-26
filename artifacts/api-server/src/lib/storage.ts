import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Document storage with optimistic concurrency.
 *
 * Every document is one JSON value with an integer version. A commit applies
 * all changed documents in one database transaction and only succeeds when
 * every document is still at the version the request loaded. Otherwise nothing
 * is written and the caller gets a conflict.
 */
export type StoredRow = {
  key: string;
  value: string;
  version: number;
  updatedAt?: string;
};
export type SandboxSpec = {
  id: string;
  docs: { key: string; value: string }[];
  metaKey: string;
  maxSandboxes: number;
  ttlMs: number;
  throttleMax: number;
  throttleWindowMs: number;
};
export type SandboxResult =
  | { ok: true }
  | { ok: false; reason: "full" | "throttled" };
const THROTTLE_KEY = "demo-throttle";
const SANDBOX_ID = /^[a-f0-9]{32}$/;
export type DocumentChange = {
  key: string;
  value: string;
  expectedVersion: number;
};
export type CommitResult = { ok: true } | { ok: false; conflictKey: string };

export interface StorageBackend {
  readonly description: string;
  /** Create the schema and insert missing documents (never overwrites). */
  ensure(defaults: { key: string; value: string }[]): Promise<void>;
  /** Load exactly these documents. Missing keys are simply absent. */
  loadKeys(keys: string[]): Promise<StoredRow[]>;
  /**
   * Atomically (one database transaction, so also across instances): delete
   * expired sandboxes, enforce the global creation throttle and the sandbox
   * cap, then insert the new sandbox documents.
   */
  createSandbox(spec: SandboxSpec): Promise<SandboxResult>;
  commit(changes: DocumentChange[]): Promise<CommitResult>;
  close?(): Promise<void>;
}

export function getDataDirectory() {
  const configuredPath = process.env["PHARMACY_DATA_DIR"];
  return configuredPath
    ? resolve(configuredPath)
    : resolve(process.cwd(), "data");
}

function isBusy(error: unknown) {
  const text = `${(error as any)?.code ?? ""} ${(error as any)?.message ?? ""} ${(error as any)?.cause?.message ?? ""}`;
  return /SQLITE_BUSY|database is locked/i.test(text);
}

/** A local database file used by several processes can be briefly locked. */
async function retryWhileBusy<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isBusy(error) || attempt >= 60) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 40));
    }
  }
}

function parseThrottle(raw: string | undefined, now: number, windowMs: number) {
  try {
    const parsed = raw ? (JSON.parse(raw) as { start?: number; count?: number }) : {};
    const start = Number(parsed.start);
    const count = Number(parsed.count);
    if (Number.isFinite(start) && Number.isFinite(count) && now - start < windowMs)
      return { start, count };
  } catch {
    // fall through: start a new window
  }
  return { start: now, count: 0 };
}

class ConflictSignal extends Error {
  constructor(readonly key: string) {
    super(`version conflict on ${key}`);
  }
}

/* ---------------------------- Local SQLite file --------------------------- */

type SqliteDatabase = {
  pragma(sql: string): unknown;
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...args: unknown[]): { changes: number };
    all(...args: unknown[]): unknown[];
    get(...args: unknown[]): unknown;
  };
  transaction<T>(fn: () => T): { immediate: () => T };
  close(): void;
};

class LocalSqliteBackend implements StorageBackend {
  readonly description: string;
  private db: SqliteDatabase | undefined;

  constructor(private readonly dataDir: string) {
    this.description = `sqlite:${resolve(dataDir, "pharmacy.sqlite3")}`;
  }

  private async open() {
    if (this.db) return this.db;
    mkdirSync(this.dataDir, { recursive: true });
    const { default: Database } = (await import("better-sqlite3")) as unknown as {
      default: new (path: string) => SqliteDatabase;
    };
    const db = new Database(resolve(this.dataDir, "pharmacy.sqlite3"));
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = FULL");
    db.pragma("busy_timeout = 5000");
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_documents (
        document_key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    const columns = db
      .prepare("PRAGMA table_info(app_documents)")
      .all() as { name: string }[];
    if (!columns.some((column) => column.name === "version")) {
      db.exec(
        "ALTER TABLE app_documents ADD COLUMN version INTEGER NOT NULL DEFAULT 1",
      );
    }
    this.db = db;
    return db;
  }

  async ensure(defaults: { key: string; value: string }[]) {
    const db = await this.open();
    const select = db.prepare(
      "SELECT 1 FROM app_documents WHERE document_key = ?",
    );
    const insert = db.prepare(
      `INSERT INTO app_documents (document_key, value, updated_at, version)
       VALUES (?, ?, ?, 1) ON CONFLICT(document_key) DO NOTHING`,
    );
    for (const item of defaults) {
      if (select.get(item.key)) continue;
      // A JSON file from an older version of the app is imported once.
      const legacy = resolve(this.dataDir, item.key);
      const value = existsSync(legacy)
        ? JSON.stringify(JSON.parse(readFileSync(legacy, "utf8")))
        : item.value;
      insert.run(item.key, value, new Date().toISOString());
    }
  }

  async loadKeys(keys: string[]) {
    const db = await this.open();
    const select = db.prepare(
      "SELECT document_key, value, version, updated_at FROM app_documents WHERE document_key = ?",
    );
    const rows: StoredRow[] = [];
    for (const key of keys) {
      const row = select.get(key) as
        | { document_key: string; value: string; version: number; updated_at: string }
        | undefined;
      if (row)
        rows.push({
          key: row.document_key,
          value: row.value,
          version: Number(row.version),
          updatedAt: row.updated_at,
        });
    }
    return rows;
  }

  async createSandbox(spec: SandboxSpec): Promise<SandboxResult> {
    const db = await this.open();
    const apply = db.transaction((): SandboxResult => {
      const now = Date.now();
      const nowIso = new Date(now).toISOString();
      const cutoff = new Date(now - spec.ttlMs).toISOString();
      const expired = db
        .prepare(
          "SELECT document_key FROM app_documents WHERE document_key GLOB 'sbx_*/meta' AND updated_at < ? LIMIT 25",
        )
        .all(cutoff) as { document_key: string }[];
      for (const row of expired) {
        const id = row.document_key.slice(4, row.document_key.indexOf("/"));
        if (SANDBOX_ID.test(id))
          db.prepare("DELETE FROM app_documents WHERE document_key GLOB ?").run(
            `sbx_${id}/*`,
          );
      }
      const throttleRow = db
        .prepare("SELECT value FROM app_documents WHERE document_key = ?")
        .get(THROTTLE_KEY) as { value: string } | undefined;
      const throttle = parseThrottle(throttleRow?.value, now, spec.throttleWindowMs);
      if (throttle.count >= spec.throttleMax)
        return { ok: false, reason: "throttled" };
      const live = db
        .prepare(
          "SELECT count(*) AS n FROM app_documents WHERE document_key GLOB 'sbx_*/meta' AND updated_at >= ?",
        )
        .get(cutoff) as { n: number };
      if (Number(live.n) >= spec.maxSandboxes) return { ok: false, reason: "full" };
      db.prepare(
        `INSERT INTO app_documents (document_key, value, updated_at, version)
         VALUES (?, ?, ?, 1)
         ON CONFLICT(document_key) DO UPDATE SET value = excluded.value,
           updated_at = excluded.updated_at, version = version + 1`,
      ).run(
        THROTTLE_KEY,
        JSON.stringify({ start: throttle.start, count: throttle.count + 1 }),
        nowIso,
      );
      const insert = db.prepare(
        "INSERT INTO app_documents (document_key, value, updated_at, version) VALUES (?, ?, ?, 1)",
      );
      for (const doc of spec.docs) insert.run(doc.key, doc.value, nowIso);
      return { ok: true };
    });
    return apply.immediate();
  }

  async commit(changes: DocumentChange[]): Promise<CommitResult> {
    const db = await this.open();
    const update = db.prepare(
      `UPDATE app_documents
         SET value = ?, version = version + 1, updated_at = ?
       WHERE document_key = ? AND version = ?`,
    );
    const apply = db.transaction((): CommitResult => {
      const now = new Date().toISOString();
      for (const change of changes) {
        const result = update.run(
          change.value,
          now,
          change.key,
          change.expectedVersion,
        );
        // Throwing rolls the whole transaction back.
        if (result.changes !== 1) throw new ConflictSignal(change.key);
      }
      return { ok: true };
    });
    try {
      // BEGIN IMMEDIATE so two writers never interleave.
      return apply.immediate();
    } catch (error) {
      if (error instanceof ConflictSignal)
        return { ok: false, conflictKey: error.key };
      throw error;
    }
  }

  async close() {
    this.db?.close();
    this.db = undefined;
  }
}

/* ------------------------- libSQL (Turso or file:) ------------------------- */

type LibsqlResult = { rows: Record<string, unknown>[]; rowsAffected: number };
type LibsqlStatement = { sql: string; args?: unknown[] };
type LibsqlTransaction = {
  execute(stmt: LibsqlStatement): Promise<LibsqlResult>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  close(): void;
};
type LibsqlClient = {
  execute(stmt: LibsqlStatement | string): Promise<LibsqlResult>;
  transaction(mode: "write" | "read" | "deferred"): Promise<LibsqlTransaction>;
  close(): void;
};

class LibsqlBackend implements StorageBackend {
  readonly description: string;
  private client: LibsqlClient | undefined;

  constructor(
    private readonly url: string,
    private readonly authToken: string | undefined,
  ) {
    this.description = `libsql:${url.replace(/\?.*$/, "")}`;
  }

  private async open() {
    if (this.client) return this.client;
    // Remote databases use the web client (plain HTTPS, no native code, which
    // is what a serverless function needs). Local files use the native client.
    const { createClient } = (this.url.startsWith("file:")
      ? await import("@libsql/client")
      : await import("@libsql/client/web")) as unknown as {
      createClient: (config: {
        url: string;
        authToken?: string;
      }) => LibsqlClient;
    };
    this.client = createClient({
      url: this.url,
      ...(this.authToken ? { authToken: this.authToken } : {}),
    });
    if (this.url.startsWith("file:")) {
      // A local file shared by several processes (tests, development).
      await this.client.execute("PRAGMA journal_mode = WAL");
      await this.client.execute("PRAGMA busy_timeout = 5000");
    }
    return this.client;
  }

  async ensure(defaults: { key: string; value: string }[]) {
    const client = await this.open();
    await retryWhileBusy(() =>
      client.execute(`
        CREATE TABLE IF NOT EXISTS app_documents (
          document_key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1
        )
      `),
    );
    for (const item of defaults) {
      await retryWhileBusy(() =>
        client.execute({
          sql: `INSERT INTO app_documents (document_key, value, updated_at, version)
                VALUES (?, ?, ?, 1) ON CONFLICT(document_key) DO NOTHING`,
          args: [item.key, item.value, new Date().toISOString()],
        }),
      );
    }
  }

  async loadKeys(keys: string[]) {
    const client = await this.open();
    if (!keys.length) return [];
    const marks = keys.map(() => "?").join(",");
    const result = await retryWhileBusy(() =>
      client.execute({
        sql: `SELECT document_key, value, version, updated_at FROM app_documents WHERE document_key IN (${marks})`,
        args: keys,
      }),
    );
    return result.rows.map((row) => ({
      key: String(row["document_key"]),
      value: String(row["value"]),
      version: Number(row["version"]),
      updatedAt: String(row["updated_at"]),
    }));
  }

  async createSandbox(spec: SandboxSpec): Promise<SandboxResult> {
    return retryWhileBusy(() => this.createSandboxOnce(spec));
  }

  private async createSandboxOnce(spec: SandboxSpec): Promise<SandboxResult> {
    const client = await this.open();
    const tx = await client.transaction("write");
    try {
      const now = Date.now();
      const nowIso = new Date(now).toISOString();
      const cutoff = new Date(now - spec.ttlMs).toISOString();
      const expired = await tx.execute({
        sql: "SELECT document_key FROM app_documents WHERE document_key GLOB 'sbx_*/meta' AND updated_at < ? LIMIT 25",
        args: [cutoff],
      });
      for (const row of expired.rows) {
        const key = String(row["document_key"]);
        const id = key.slice(4, key.indexOf("/"));
        if (SANDBOX_ID.test(id))
          await tx.execute({
            sql: "DELETE FROM app_documents WHERE document_key GLOB ?",
            args: [`sbx_${id}/*`],
          });
      }
      const throttleRow = await tx.execute({
        sql: "SELECT value FROM app_documents WHERE document_key = ?",
        args: [THROTTLE_KEY],
      });
      const throttle = parseThrottle(
        throttleRow.rows[0] ? String(throttleRow.rows[0]["value"]) : undefined,
        now,
        spec.throttleWindowMs,
      );
      let result: SandboxResult = { ok: true };
      if (throttle.count >= spec.throttleMax) {
        result = { ok: false, reason: "throttled" };
      } else {
        const live = await tx.execute({
          sql: "SELECT count(*) AS n FROM app_documents WHERE document_key GLOB 'sbx_*/meta' AND updated_at >= ?",
          args: [cutoff],
        });
        if (Number(live.rows[0]?.["n"] ?? 0) >= spec.maxSandboxes) {
          result = { ok: false, reason: "full" };
        } else {
          await tx.execute({
            sql: `INSERT INTO app_documents (document_key, value, updated_at, version)
                  VALUES (?, ?, ?, 1)
                  ON CONFLICT(document_key) DO UPDATE SET value = excluded.value,
                    updated_at = excluded.updated_at, version = version + 1`,
            args: [
              THROTTLE_KEY,
              JSON.stringify({ start: throttle.start, count: throttle.count + 1 }),
              nowIso,
            ],
          });
          for (const doc of spec.docs)
            await tx.execute({
              sql: "INSERT INTO app_documents (document_key, value, updated_at, version) VALUES (?, ?, ?, 1)",
              args: [doc.key, doc.value, nowIso],
            });
        }
      }
      await tx.commit();
      return result;
    } catch (error) {
      try {
        await tx.rollback();
      } catch {
        // The original error is the useful one.
      }
      throw error;
    } finally {
      tx.close();
    }
  }

  async commit(changes: DocumentChange[]): Promise<CommitResult> {
    return retryWhileBusy(() => this.commitOnce(changes));
  }

  private async commitOnce(changes: DocumentChange[]): Promise<CommitResult> {
    const client = await this.open();
    const tx = await client.transaction("write");
    try {
      const now = new Date().toISOString();
      for (const change of changes) {
        const result = await tx.execute({
          sql: `UPDATE app_documents
                  SET value = ?, version = version + 1, updated_at = ?
                WHERE document_key = ? AND version = ?`,
          args: [change.value, now, change.key, change.expectedVersion],
        });
        if (result.rowsAffected !== 1) {
          await tx.rollback();
          return { ok: false, conflictKey: change.key };
        }
      }
      await tx.commit();
      return { ok: true };
    } catch (error) {
      try {
        await tx.rollback();
      } catch {
        // The original error is the useful one.
      }
      throw error;
    } finally {
      tx.close();
    }
  }

  async close() {
    this.client?.close();
    this.client = undefined;
  }
}

/* --------------------------------- Factory -------------------------------- */

export function createBackendFromEnvironment(): StorageBackend {
  const url = process.env["TURSO_DATABASE_URL"]?.trim();
  if (url) return new LibsqlBackend(url, process.env["TURSO_AUTH_TOKEN"]?.trim());
  return new LocalSqliteBackend(getDataDirectory());
}

export { LocalSqliteBackend, LibsqlBackend };
