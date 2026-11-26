import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type StoredDocument = {
  value: string;
};

let database: Database.Database | undefined;
let databasePath: string | undefined;

function findApiServerDirectory() {
  let current = dirname(fileURLToPath(import.meta.url));

  for (let depth = 0; depth < 5; depth += 1) {
    const packagePath = resolve(current, "package.json");
    if (existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
          name?: string;
        };
        if (packageJson.name === "@workspace/api-server") return current;
      } catch {
        // Keep walking: this may be a package.json for another workspace package.
      }
    }
    current = resolve(current, "..");
  }

  const workspaceArtifact = resolve(process.cwd(), "artifacts", "api-server");
  return existsSync(resolve(workspaceArtifact, "package.json"))
    ? workspaceArtifact
    : process.cwd();
}

function getDataDirectory() {
  const configuredPath = process.env["PHARMACY_DATA_DIR"];
  return configuredPath
    ? resolve(configuredPath)
    : resolve(findApiServerDirectory(), "data");
}

function getDatabase() {
  if (database) return database;

  const dataDir = getDataDirectory();
  mkdirSync(dataDir, { recursive: true });
  databasePath = resolve(dataDir, "pharmacy.sqlite3");
  database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("synchronous = FULL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_documents (
      document_key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  return database;
}

function saveDocument<T>(key: string, value: T) {
  getDatabase()
    .prepare(
      `INSERT INTO app_documents (document_key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(document_key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
    )
    .run(key, JSON.stringify(value), new Date().toISOString());
}

export function createPersistentJson<T>(fileName: string, defaults: T) {
  const db = getDatabase();
  const stored = db
    .prepare("SELECT value FROM app_documents WHERE document_key = ?")
    .get(fileName) as StoredDocument | undefined;

  let data: T;
  if (stored) {
    try {
      data = JSON.parse(stored.value) as T;
    } catch (error) {
      throw new Error(`Could not read ${fileName} from ${databasePath}`, {
        cause: error,
      });
    }
  } else {
    const legacyFilePath = resolve(getDataDirectory(), fileName);
    if (existsSync(legacyFilePath)) {
      try {
        data = JSON.parse(readFileSync(legacyFilePath, "utf8")) as T;
      } catch (error) {
        throw new Error(`Could not migrate persistent data: ${legacyFilePath}`, {
          cause: error,
        });
      }
    } else {
      data = structuredClone(defaults);
    }
    saveDocument(fileName, data);
  }

  return {
    get data() {
      return data;
    },
    save(next: T) {
      data = structuredClone(next);
      saveDocument(fileName, data);
    },
    filePath: databasePath,
  };
}
