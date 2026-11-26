# Pharmacy ERP

A full-stack pharmacy operations dashboard for inventory, orders, sales, customers, payments, reports, and settings.

## Run & Operate

- `pnpm dev` — run the API server (port 5000) and web app (port 5173)
- `pnpm --filter @workspace/api-server run dev` — run only the API server
- `pnpm --filter @workspace/pharmacy-erp run dev` — run only the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm test` — run backend integration tests
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Optional env: `PORT` for a single package, `BASE_PATH` for web hosting, and
  `API_PROXY_TARGET` for a non-default API address
- Default local login: `admin@pharmacy.local` / `pharmacy123`
- Override the login with `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables
- Override the persistent data folder with `PHARMACY_DATA_DIR`

## Stack

- pnpm workspaces, Node.js 22+, TypeScript 5.9
- API: Express 5
- Data: durable SQLite database in WAL mode with automatic legacy JSON migration
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Web app: `artifacts/pharmacy-erp/src`
- API server: `artifacts/api-server/src`
- OpenAPI source of truth: `lib/api-spec/openapi.yaml`
- Generated API client: `lib/api-client-react/src/generated`
- Generated validators: `lib/api-zod/src/generated`
- Database package: `lib/db`
- Persistent database: `artifacts/api-server/data/pharmacy.sqlite3`

## Architecture decisions

- OpenAPI is the contract source; React hooks and Zod validators are generated from it.
- The web app uses a same-origin `/api` path and Vite proxies it to the local API in development and preview.
- Local ports default to 5173 for the web app, 5174 for the mockup sandbox, and 5000 for the API.
- Authentication uses a secure, HTTP-only session cookie. All pharmacy API routes require a signed-in session.
- Products, categories, orders, sales, customers, payments, suppliers, purchases, stock movements, returns, settings, users, sessions, audit events, and profile changes are written to SQLite and survive API restarts.
- Checkout validates stock and records orders, sales, payments, stock movements, and audit events as one operation.
- Dashboard and report totals are calculated from the stored operational records rather than hard-coded UI values.

## Product

- Responsive pharmacy operations dashboard with POS checkout, inventory, batches, suppliers, purchasing, returns/refunds, team roles, audit trail, backup/restore, categories, orders, sales, customers, payments, reports, settings, profile verification, CSV export, filtering, sorting, and pagination.

## User preferences

- Keep the supplied pharmacy dashboard visual language consistent across every page and modal.
- Every visible action should either navigate, mutate persisted data, filter/sort the current view, or export a file.

## Gotchas

- Use pnpm; the preinstall check rejects npm and yarn.
- Sessions are persisted in SQLite and remain valid across API restarts until expiry or sign-out.
- Run API code generation after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
