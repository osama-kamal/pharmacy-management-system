// Vercel function: all /api requests are served by the bundled Express app.
// The bundle is produced by `pnpm run build:vercel` (api/_server.mjs).
import app from "./_server.mjs";

export default app;
