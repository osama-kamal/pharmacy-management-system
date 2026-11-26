import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";

let server: Server;
let baseUrl = "";
let cookie = "";

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    ...init,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body: any =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();
  return { response, body };
}

before(async () => {
  process.env.PHARMACY_DATA_DIR = mkdtempSync(
    join(tmpdir(), "pharmacy-erp-test-"),
  );
  process.env.NODE_ENV = "test";
  const { default: app } = await import("./app");
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert(address && typeof address === "object");
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("guest session check is clean and login creates an authenticated session", async () => {
  const guest = await request("/auth/me");
  assert.equal(guest.response.status, 200);
  assert.equal(guest.body.user, null);

  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@pharmacy.local",
      password: "pharmacy123",
    }),
  });
  assert.equal(login.response.status, 200);
  cookie = login.response.headers.get("set-cookie")?.split(";")[0] ?? "";
  assert.match(cookie, /^pharmacy_session=/);
});

test("POS checkout updates stock, sale, payment and audit atomically", async () => {
  const beforeProducts = await request("/products");
  const product = beforeProducts.body[0];
  const checkout = await request("/pos/checkout", {
    method: "POST",
    body: JSON.stringify({
      customer: "Integration Test",
      paymentMethod: "Cash",
      items: [{ productId: product.id, quantity: 1 }],
    }),
  });
  assert.equal(checkout.response.status, 201);
  assert.match(checkout.body.receiptNumber, /^REC-/);

  const afterProducts = await request("/products");
  const updated = afterProducts.body.find((item: any) => item.id === product.id);
  assert.equal(updated.stock, product.stock - 1);

  const payments = await request("/payments");
  assert(payments.body.some((item: any) => item.reference === checkout.body.receiptNumber));
  const audit = await request("/audit-log");
  assert(audit.body.some((item: any) => item.action === "checkout"));
});

test("return restores stock and creates a refund", async () => {
  const sales = await request("/sales");
  const sale = sales.body.find((item: any) => item.customer === "Integration Test");
  assert(sale);
  const beforeProducts = await request("/products");
  const product = beforeProducts.body.find((item: any) => item.name === sale.product);

  const returned = await request("/returns", {
    method: "POST",
    body: JSON.stringify({
      saleId: sale.id,
      quantity: 1,
      reason: "Integration test return",
    }),
  });
  assert.equal(returned.response.status, 201);

  const afterProducts = await request("/products");
  const restored = afterProducts.body.find((item: any) => item.id === product.id);
  assert.equal(restored.stock, product.stock + 1);
  const payments = await request("/payments");
  assert(payments.body.some((item: any) => item.status === "Refunded"));
});

test("owners can manage team accounts and export an operational backup", async () => {
  const created = await request("/users", {
    method: "POST",
    body: JSON.stringify({
      name: "Test Pharmacist",
      email: "test.pharmacist@example.com",
      password: "StrongPass123!",
      role: "Pharmacist",
    }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.role, "Pharmacist");
  assert.equal("passwordHash" in created.body, false);

  const backup = await request("/backup/export");
  assert.equal(backup.response.status, 200);
  assert.equal(backup.body.version, 1);
  assert(Array.isArray(backup.body.data.products));
  assert(Array.isArray(backup.body.data.auditEvents));
});

test("profile changes survive a fresh session read", async () => {
  const updated = await request("/profile", {
    method: "PATCH",
    body: JSON.stringify({ name: "Persistent Owner Name" }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.name, "Persistent Owner Name");

  const sessionRead = await request("/auth/me");
  assert.equal(sessionRead.response.status, 200);
  assert.equal(sessionRead.body.user.name, "Persistent Owner Name");
});

test("receiving a purchase order increases durable stock", async () => {
  const productList = await request("/products");
  const product = productList.body[0];
  const supplier = await request("/suppliers", {
    method: "POST",
    body: JSON.stringify({
      name: "Integration Supplier",
      email: "supplier@example.com",
      phone: "+201000000000",
      address: "Cairo",
    }),
  });
  assert.equal(supplier.response.status, 201);
  const purchase = await request("/purchases", {
    method: "POST",
    body: JSON.stringify({
      supplierId: supplier.body.id,
      items: [{ productId: product.id, quantity: 7, cost: 3.5 }],
    }),
  });
  assert.equal(purchase.response.status, 201);
  assert.equal(purchase.body.status, "Ordered");

  const received = await request(`/purchases/${purchase.body.id}/receive`, {
    method: "PATCH",
  });
  assert.equal(received.response.status, 200);
  const productsAfter = await request("/products");
  const updated = productsAfter.body.find((item: any) => item.id === product.id);
  assert.equal(updated.stock, product.stock + 7);
});

test("role permissions block cashiers from supplier administration", async () => {
  const ownerCookie = cookie;
  const created = await request("/users", {
    method: "POST",
    body: JSON.stringify({
      name: "Test Cashier",
      email: "cashier@example.com",
      password: "CashierPass123!",
      role: "Cashier",
    }),
  });
  assert.equal(created.response.status, 201);
  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "cashier@example.com",
      password: "CashierPass123!",
    }),
  });
  cookie = login.response.headers.get("set-cookie")?.split(";")[0] ?? "";
  const denied = await request("/suppliers", {
    method: "POST",
    body: JSON.stringify({ name: "Blocked Supplier" }),
  });
  assert.equal(denied.response.status, 403);
  const deniedExport = await request("/integrations/eptts/products.csv");
  assert.equal(deniedExport.response.status, 403);
  cookie = ownerCookie;
  const allowedExport = await request("/integrations/eptts/products.csv");
  assert.equal(allowedExport.response.status, 200);
  assert.match(
    allowedExport.response.headers.get("content-type") ?? "",
    /text\/csv/,
  );
});
