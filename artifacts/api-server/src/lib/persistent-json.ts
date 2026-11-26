import {
  createBackendFromEnvironment,
  type CommitResult,
  type StorageBackend,
} from "./storage";

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

  get description() {
    return this.backend?.description ?? "uninitialised";
  }

  private getBackend() {
    this.backend ??= createBackendFromEnvironment();
    return this.backend;
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

  /** Load the latest committed value of every document into memory. */
  async hydrate() {
    await this.ensure();
    const rows = await this.getBackend().loadAll();
    const byKey = new Map(rows.map((row) => [row.key, row]));
    for (const store of stores.values()) {
      const row = byKey.get(store.name);
      if (!row) throw new Error(`Stored document is missing: ${store.name}`);
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
    return this.getBackend().commit(
      changed.map((store) => ({
        key: store.name,
        value: JSON.stringify(store.data),
        expectedVersion: store.version,
      })),
    );
  }
}

export const persistence = new Persistence();
