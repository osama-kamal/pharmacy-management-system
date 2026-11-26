import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Orval emits Zod validators and TypeScript models with a few identical names.
// The API server consumes validators; the React client owns public API models.
writeFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "lib", "api-zod", "src", "index.ts"),
  'export * from "./generated/api";\n',
  "utf8",
);
