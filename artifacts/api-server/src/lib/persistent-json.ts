import {
  createBackendFromEnvironment,
  type CommitResult,
  type SandboxResult,
  type StorageBackend,
} from "./storage";

/** Demo sandboxes: independent copies of the four documents per visitor. */
export const SANDBOX_TOKEN = /^sbx_([a-f0-9]{32})\.[a-f0-9]{64}$/;
export const SANDBOX_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_SANDBOXES = 100;
const SANDBOX_THROTTLE_MAX = 30;
const limitFromEnvironment = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? Math.min(value, fallback) : fallback;
};
const SANDBOX_THROTTLE_WINDOW_MS = 10 * 60 * 1000;
export const MAX_SANDBOX_DOCUMENT_BYTES = 1_000_000;

/** The sandbox is not (or no longer) known. Never falls back to the owner's data. */
export class UnknownSandboxError extends Error {
  constructor() {
    super("Unknown or expired demo sandbox");
  }
}
export class SandboxLimitError extends Error {
  constructor() {
    super("Demo storage limit reached");
  }
}

/**
 * Named JSON documents shared through a storage backend.
 *
 * A store is a plain in-memory value for the request that is running. The
 * transaction middleware (see transaction.ts) loads every document at the start
 * of a request and commits the changed ones before the response is sent, so the
 * database stays the single source of truth across processes and instances.
 */
type StoreInternal = {
  name: string;
  defaultsJson: string;
  data: unknown;
  version: number;
  dirty: boolean;
  onLoad?: (data: any) => void;
};

const stores = new Map<string, StoreInternal>();

export function createPersistentJson<T>(
  name: string,
  defaults: T,
  onLoad?: (data: T) => void,
) {
  if (stores.has(name)) throw new Error(`Duplicate persistent store: ${name}`);
  const internal: StoreInternal = {
    name,
    defaultsJson: JSON.stringify(defaults),
    data: structuredClone(defaults),
    version: 0,
    dirty: false,
    onLoad,
  };
  stores.set(name, internal);
  onLoad?.(internal.data as T);

  return {
    get data() {
      return internal.data as T;
    },
    save(next: T) {
      internal.data = structuredClone(next);
      internal.dirty = true;
    },
    get filePath() {
      return persistence.description;
    },
  };
}

class Persistence {
  private backend: StorageBackend | undefined;
  private ensuring: Promise<void> | undefined;
  private tenant: string | undefined;

  get description() {
    return this.backend?.description ?? "uninitialised";
  }

  private getBackend() {
    this.backend ??= createBackendFromEnvironment();
    return this.backend;
  }

  private keyFor(name: string) {
    return this.tenant ? `sbx_${this.tenant}/${name}` : name;
  }

  /** Replace the backend (used by tests). */
  async useBackend(backend: StorageBackend) {
    await this.close();
    this.backend = backend;
  }

  async close() {
    this.ensuring = undefined;
    await this.backend?.close?.();
    this.backend = undefined;
  }

  private ensure() {
    this.ensuring ??= this.getBackend()
      .ensure(
        [...stores.values()].map((store) => ({
          key: store.name,
          value: store.defaultsJson,
        })),
      )
      .catch((error) => {
        this.ensuring = undefined;
        throw error;
      });
    return this.ensuring;
  }

  /**
   * Load the latest committed value of every document into memory. With a
   * tenant (sandbox id) only that sandbox's documents are read, and a sandbox
   * that does not exist or has expired is an error, never created on the fly.
   */
  async hydrate(tenant?: string) {
    if (tenant !== undefined && !/^[a-f0-9]{32}$/.test(tenant))
      throw new UnknownSandboxError();
    this.tenant = tenant;
    await this.ensure();
    const names = [...stores.values()].map((store) => store.name);
    const keys = names.map((name) => this.keyFor(name));
    if (tenant) keys.push(`sbx_${tenant}/meta`);
    const rows = await this.getBackend().loadKeys(keys);
    const byKey = new Map(rows.map((row) => [row.key, row]));
    if (tenant) {
      const meta = byKey.get(`sbx_${tenant}/meta`);
      if (
        !meta?.updatedAt ||
        Date.now() - Date.parse(meta.updatedAt) >= SANDBOX_TTL_MS
      )
        throw new UnknownSandboxError();
    }
    for (const store of stores.values()) {
      const row = byKey.get(this.keyFor(store.name));
      if (!row) {
        if (tenant) throw new UnknownSandboxError();
        throw new Error(`Stored document is missing: ${store.name}`);
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(row.value);
      } catch (error) {
        throw new Error(`Could not read ${store.name}`, { cause: error });
      }
      store.data = parsed;
      store.version = row.version;
      store.dirty = false;
      store.onLoad?.(parsed);
    }
  }

  hasChanges() {
    return [...stores.values()].some((store) => store.dirty);
  }

  /** Write every changed document in one all-or-nothing transaction. */
  async commit(): Promise<CommitResult> {
    const changed = [...stores.values()].filter((store) => store.dirty);
    if (!changed.length) return { ok: true };
    const changes = changed.map((store) => ({
      key: this.keyFor(store.name),
      value: JSON.stringify(store.data),
      expectedVersion: store.version,
    }));
    if (
      this.tenant &&
      changes.some((change) => change.value.length > MAX_SANDBOX_DOCUMENT_BYTES)
    )
      throw new SandboxLimitError();
    return this.getBackend().commit(changes);
  }

  /** Default content of every document, with optional replacements. */
  defaultDocuments(overrides: Record<string, string> = {}) {
    return [...stores.values()].map((store) => ({
      name: store.name,
      value: overrides[store.name] ?? store.defaultsJson,
    }));
  }

  /** Create a new sandbox (atomic across instances, see StorageBackend). */
  async createSandbox(
    id: string,
    overrides: Record<string, string>,
  ): Promise<SandboxResult> {
    if (!/^[a-f0-9]{32}$/.test(id)) throw new Error("Invalid sandbox id");
    await this.ensure();
    const docs = this.defaultDocuments(overrides).map((doc) => ({
      key: `sbx_${id}/${doc.name}`,
      value: doc.value,
    }));
    docs.push({ key: `sbx_${id}/meta`, value: "{}" });
    return this.getBackend().createSandbox({
      id,
      docs,
      metaKey: `sbx_${id}/meta`,
      maxSandboxes: limitFromEnvironment("DEMO_MAX_SANDBOXES", MAX_SANDBOXES),
      ttlMs: SANDBOX_TTL_MS,
      throttleMax: limitFromEnvironment("DEMO_THROTTLE_MAX", SANDBOX_THROTTLE_MAX),
      throttleWindowMs: SANDBOX_THROTTLE_WINDOW_MS,
    });
  }
}

export const persistence = new Persistence();
