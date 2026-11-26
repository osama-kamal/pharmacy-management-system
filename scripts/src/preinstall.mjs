import { rmSync } from "node:fs";
import { resolve } from "node:path";

const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead of npm or yarn.");
  process.exit(1);
}

for (const lockfile of ["package-lock.json", "yarn.lock"]) {
  rmSync(resolve(process.cwd(), lockfile), { force: true });
}
