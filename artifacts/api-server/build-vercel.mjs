// Bundles the Express app into one file that the Vercel function in /api loads.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

await build({
  entryPoints: [path.resolve(here, "src/app.ts")],
  outfile: path.resolve(root, "api/_server.mjs"),
  platform: "node",
  target: "node22",
  format: "esm",
  bundle: true,
  sourcemap: false,
  logLevel: "info",
  // Only used for local files; never loaded when a remote database is configured.
  external: ["better-sqlite3"],
  plugins: [
    {
      // Only the exact native entry stays external. "@libsql/client/web" (plain
      // HTTPS, used for the hosted database) is bundled into the function.
      name: "external-native-libsql",
      setup(b) {
        b.onResolve({ filter: /^@libsql\/client$/ }, (args) => ({
          path: args.path,
          external: true,
        }));
      },
    },
  ],
  banner: {
    js: `import { createRequire as __cr } from 'node:module';
const require = __cr(import.meta.url);`,
  },
});
