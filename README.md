# Pharmacy ERP

A full-stack, responsive pharmacy operations system with a React dashboard,
Express API, and durable SQLite storage.

## Included modules

- Point of Sale with multi-item checkout, discounts, tax, payment recording,
  printable receipt data, and live stock validation
- Product catalog with SKU, barcode/GTIN, batch, expiry, cost, price, unit, and
  reorder level
- Inventory ledger, adjustments, low-stock alerts, and expiry alerts
- Suppliers, purchase orders, batch receiving, supplier balances, and costs
- Orders, sales, payments, refunds, and customer returns
- Customers, categories, reporting, CSV exports, and interactive charts
- Customer allergies, conditions, prescription references, consent, and loyalty
- Team accounts with scrypt password hashing and role-based permissions
- Persistent HTTP-only sessions, login throttling, security headers, and CORS
- Operational audit trail and business-data backup export/restore
- Arabic/English interface and responsive desktop, tablet, and mobile layouts

## Local development

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173>.

Demo credentials:

- Email: `admin@pharmacy.local`
- Password: `pharmacy123`

The demo password is intended only for local evaluation. Use a strong
`ADMIN_PASSWORD` before creating the first production database.

## Quality checks

```bash
pnpm run typecheck
pnpm test
pnpm run build
```

## Production with Docker

Copy `.env.example` to `.env`, replace the initial administrator password,
and run:

```bash
docker compose up --build -d
```

The web application and API are served together at <http://localhost:5000>.
SQLite data is kept in the named `pharmacy-data` volume.
Fresh production databases start empty unless `SEED_DEMO_DATA=true` is set.

## Data safety

- Runtime data is stored in `PHARMACY_DATA_DIR/pharmacy.sqlite3`.
- Download backups from Administration before upgrades or bulk imports.
- User passwords and active sessions stay protected in the database and are not
  included in downloadable operational backups.
- Restore requires both a valid backup document and explicit confirmation.
- Database files, local environment files, and secrets are excluded from Git
  and Docker build contexts.

## External integrations

The project stores GS1-compatible barcode/GTIN, batch, expiry, and serial-ready
product data. Authorized Owner, Manager, and Inventory roles can export a
traceability CSV from Inventory Control. Connecting that export to Egypt's EPTTS
production service still requires licensed credentials and the authority's
current exchange contract; no unofficial external API is called.
