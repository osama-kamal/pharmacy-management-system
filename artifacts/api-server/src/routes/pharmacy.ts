import { Router, type IRouter, type Request, type Response } from "express";
import { createPersistentJson } from "../lib/persistent-json";
import {
  CreateCategoryBody,
  CreateCustomerBody,
  CreateOrderBody,
  CreatePaymentBody,
  CreateProductBody,
  CreateSaleBody,
  GetDashboardResponse,
  GetReportsSummaryResponse,
  GetSettingsResponse,
  UpdateCategoryBody,
  UpdateCategoryParams,
  UpdateCustomerBody,
  UpdateCustomerParams,
  UpdateOrderBody,
  UpdateOrderParams,
  UpdateProductBody,
  UpdateProductParams,
  UpdateSaleBody,
  UpdateSaleParams,
  UpdateSettingsBody,
} from "@workspace/api-zod";

type Product = {
  id: number;
  name: string;
  category: string;
  sku: string;
  stock: number;
  price: number;
  expiry: string;
  status: string;
  supplier?: string;
  description?: string;
  cost?: number;
  barcode?: string;
  batchNumber?: string;
  reorderLevel?: number;
  unit?: string;
};
type Category = {
  id: number;
  name: string;
  productCount: number;
  sales: number;
  color: string;
};
type Order = {
  id: number;
  customer: string;
  product: string;
  paymentMethod: string;
  quantity: number;
  total: number;
  status: string;
  date: string;
  receiptNumber?: string;
};
type Sale = {
  id: number;
  customer: string;
  product: string;
  category: string;
  quantity: number;
  total: number;
  date: string;
  orderId?: number;
  receiptNumber?: string;
  paymentMethod?: string;
  cost?: number;
  status?: string;
};
type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  status: string;
  allergies?: string;
  conditions?: string;
  notes?: string;
  prescriptions?: string;
  loyaltyPoints?: number;
  consent?: boolean;
};
type Payment = {
  id: number;
  customer: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  reference: string;
  orderId?: number;
  saleId?: number;
};
type Settings = {
  pharmacyName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  notifications: boolean;
  taxRate?: number;
  lowStockThreshold?: number;
  receiptFooter?: string;
};

type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "Active" | "Inactive";
  balance: number;
  createdAt: string;
};

type PurchaseItem = {
  productId: number;
  product: string;
  quantity: number;
  cost: number;
  batchNumber?: string;
  expiry?: string;
};

type Purchase = {
  id: number;
  reference: string;
  supplierId: number;
  supplier: string;
  items: PurchaseItem[];
  subtotal: number;
  status: "Draft" | "Ordered" | "Partially received" | "Received" | "Cancelled";
  createdAt: string;
  receivedAt?: string;
};

type InventoryMovement = {
  id: number;
  productId: number;
  product: string;
  type: "Opening" | "Purchase" | "Sale" | "Return" | "Adjustment" | "Order reversal";
  quantity: number;
  balanceAfter: number;
  reference: string;
  note?: string;
  createdAt: string;
};

type ReturnRecord = {
  id: number;
  saleId: number;
  productId: number;
  product: string;
  customer: string;
  quantity: number;
  amount: number;
  reason: string;
  status: "Completed";
  createdAt: string;
};

type AuditEvent = {
  id: number;
  action: string;
  entity: string;
  entityId?: string;
  actor: string;
  details?: string;
  createdAt: string;
};

const now = "2026-09-08T20:00:00.000Z";
const products: Product[] = [
  {
    id: 1,
    name: "Panadol Extra",
    category: "Pain Relief",
    sku: "MED-9538395",
    stock: 124,
    price: 8.5,
    expiry: "2027-04-22",
    status: "In stock",
    supplier: "Eva Pharma",
    description: "Fast relief for headaches and body aches.",
  },
  {
    id: 2,
    name: "Augmentin 625mg",
    category: "Antibiotics",
    sku: "MED-9538396",
    stock: 18,
    price: 24,
    expiry: "2026-11-12",
    status: "Low stock",
    supplier: "GSK",
    description: "Prescription antibiotic.",
  },
  {
    id: 3,
    name: "Vitamin D3",
    category: "Vitamins",
    sku: "MED-9538397",
    stock: 76,
    price: 12.75,
    expiry: "2027-06-18",
    status: "In stock",
    supplier: "Mash Premiere",
    description: "Daily vitamin D supplement.",
  },
  {
    id: 4,
    name: "Cataflam 50mg",
    category: "Pain Relief",
    sku: "MED-9538398",
    stock: 0,
    price: 15.2,
    expiry: "2026-10-04",
    status: "Out of stock",
    supplier: "Novartis",
    description: "Anti-inflammatory tablets.",
  },
  {
    id: 5,
    name: "Brufen Syrup",
    category: "Children",
    sku: "MED-9538399",
    stock: 43,
    price: 7.95,
    expiry: "2027-01-28",
    status: "In stock",
    supplier: "Abbott",
    description: "Children's fever and pain relief.",
  },
  {
    id: 6,
    name: "Nexium 40mg",
    category: "Digestive Health",
    sku: "MED-9538400",
    stock: 29,
    price: 32,
    expiry: "2026-12-05",
    status: "In stock",
    supplier: "AstraZeneca",
    description: "Digestive health medicine.",
  },
  {
    id: 7,
    name: "Omega 3",
    category: "Vitamins",
    sku: "MED-9538401",
    stock: 61,
    price: 18.5,
    expiry: "2027-03-09",
    status: "In stock",
    supplier: "Seif Pharma",
    description: "Omega 3 softgels.",
  },
  {
    id: 8,
    name: "Insulin Pen",
    category: "Diabetes",
    sku: "MED-9538402",
    stock: 7,
    price: 86,
    expiry: "2026-09-28",
    status: "Low stock",
    supplier: "Sanofi",
    description: "Temperature-controlled insulin pen.",
  },
];
const categories: Category[] = [
  { id: 1, name: "Pain Relief", productCount: 24, sales: 45, color: "#BFEA7A" },
  { id: 2, name: "Antibiotics", productCount: 18, sales: 28, color: "#70D6C7" },
  { id: 3, name: "Vitamins", productCount: 31, sales: 20, color: "#F3A5AC" },
  { id: 4, name: "Children", productCount: 12, sales: 12, color: "#9EA5E6" },
];
const customers: Customer[] = [
  {
    id: 1,
    name: "Susan Williams",
    email: "susan.williams@email.com",
    phone: "+20 100 222 8811",
    orders: 14,
    spent: 1560,
    status: "Active",
  },
  {
    id: 2,
    name: "Bentley Howard",
    email: "bentley.howard@email.com",
    phone: "+20 111 456 2200",
    orders: 9,
    spent: 980,
    status: "Active",
  },
  {
    id: 3,
    name: "Evelyn Johnson",
    email: "evelyn.johnson@email.com",
    phone: "+20 122 340 7766",
    orders: 21,
    spent: 2670,
    status: "VIP",
  },
  {
    id: 4,
    name: "Owen Miller",
    email: "owen.miller@email.com",
    phone: "+20 109 552 0199",
    orders: 5,
    spent: 420,
    status: "Active",
  },
  {
    id: 5,
    name: "Amelia Brown",
    email: "amelia.brown@email.com",
    phone: "+20 101 888 4520",
    orders: 3,
    spent: 280,
    status: "Inactive",
  },
];
const orders: Order[] = [
  {
    id: 1001,
    customer: "Susan Williams",
    product: "Panadol Extra",
    paymentMethod: "Credit Card",
    quantity: 2,
    total: 17,
    status: "Completed",
    date: now,
  },
  {
    id: 1002,
    customer: "Bentley Howard",
    product: "Augmentin 625mg",
    paymentMethod: "Cash",
    quantity: 1,
    total: 24,
    status: "Pending",
    date: "2026-09-08T18:30:00.000Z",
  },
  {
    id: 1003,
    customer: "Evelyn Johnson",
    product: "Vitamin D3",
    paymentMethod: "Credit Card",
    quantity: 3,
    total: 38.25,
    status: "Completed",
    date: "2026-09-08T16:10:00.000Z",
  },
  {
    id: 1004,
    customer: "Owen Miller",
    product: "Nexium 40mg",
    paymentMethod: "Wallet",
    quantity: 1,
    total: 32,
    status: "Processing",
    date: "2026-09-07T14:22:00.000Z",
  },
  {
    id: 1005,
    customer: "Amelia Brown",
    product: "Brufen Syrup",
    paymentMethod: "Cash",
    quantity: 2,
    total: 15.9,
    status: "Completed",
    date: "2026-09-07T11:03:00.000Z",
  },
  {
    id: 1006,
    customer: "Susan Williams",
    product: "Omega 3",
    paymentMethod: "Credit Card",
    quantity: 1,
    total: 18.5,
    status: "Completed",
    date: "2026-09-06T09:42:00.000Z",
  },
];
const sales: Sale[] = [
  {
    id: 501,
    customer: "Susan Williams",
    product: "Panadol Extra",
    category: "Pain Relief",
    quantity: 2,
    total: 17,
    date: now,
  },
  {
    id: 502,
    customer: "Bentley Howard",
    product: "Augmentin 625mg",
    category: "Antibiotics",
    quantity: 1,
    total: 24,
    date: "2026-09-08T18:30:00.000Z",
  },
  {
    id: 503,
    customer: "Evelyn Johnson",
    product: "Vitamin D3",
    category: "Vitamins",
    quantity: 3,
    total: 38.25,
    date: "2026-09-08T16:10:00.000Z",
  },
  {
    id: 504,
    customer: "Owen Miller",
    product: "Nexium 40mg",
    category: "Digestive Health",
    quantity: 1,
    total: 32,
    date: "2026-09-07T14:22:00.000Z",
  },
  {
    id: 505,
    customer: "Amelia Brown",
    product: "Brufen Syrup",
    category: "Children",
    quantity: 2,
    total: 15.9,
    date: "2026-09-07T11:03:00.000Z",
  },
];
const payments: Payment[] = [
  {
    id: 8001,
    customer: "Susan Williams",
    amount: 17,
    method: "Credit Card",
    status: "Paid",
    date: now,
    reference: "PAY-20260908-01",
  },
  {
    id: 8002,
    customer: "Bentley Howard",
    amount: 24,
    method: "Cash",
    status: "Pending",
    date: "2026-09-08T18:30:00.000Z",
    reference: "PAY-20260908-02",
  },
  {
    id: 8003,
    customer: "Evelyn Johnson",
    amount: 38.25,
    method: "Credit Card",
    status: "Paid",
    date: "2026-09-08T16:10:00.000Z",
    reference: "PAY-20260908-03",
  },
];
let settings: Settings = {
  pharmacyName: "Pharmacy",
  email: "budiono.siregar@gmail.com",
  phone: "+20 100 000 0000",
  address: "New Cairo, Egypt",
  currency: "EGP",
  notifications: true,
  taxRate: 0,
  lowStockThreshold: 10,
  receiptFooter: "Thank you for choosing our pharmacy.",
};

const suppliers: Supplier[] = [];
const purchases: Purchase[] = [];
const inventoryMovements: InventoryMovement[] = [];
const returns: ReturnRecord[] = [];
const auditEvents: AuditEvent[] = [];

type SupportTicket = {
  id: number;
  subject: string;
  message: string;
  contact: string;
  status: "Open" | "Closed";
  createdAt: string;
};

const supportTickets: SupportTicket[] = [];

type PharmacyData = {
  products: Product[];
  categories: Category[];
  orders: Order[];
  sales: Sale[];
  customers: Customer[];
  payments: Payment[];
  settings: Settings;
  supportTickets?: SupportTicket[];
  suppliers?: Supplier[];
  purchases?: Purchase[];
  inventoryMovements?: InventoryMovement[];
  returns?: ReturnRecord[];
  auditEvents?: AuditEvent[];
};

const seedDemoData =
  process.env["SEED_DEMO_DATA"] === "true" ||
  process.env.NODE_ENV !== "production";

const dataStore = createPersistentJson<PharmacyData>("pharmacy-data.json", {
  products: seedDemoData ? products : [],
  categories: seedDemoData ? categories : [],
  orders: seedDemoData ? orders : [],
  sales: seedDemoData ? sales : [],
  customers: seedDemoData ? customers : [],
  payments: seedDemoData ? payments : [],
  settings,
  supportTickets,
  suppliers,
  purchases,
  inventoryMovements,
  returns,
  auditEvents,
});

products.splice(0, products.length, ...dataStore.data.products);
categories.splice(0, categories.length, ...dataStore.data.categories);
orders.splice(0, orders.length, ...dataStore.data.orders);
sales.splice(0, sales.length, ...dataStore.data.sales);
customers.splice(0, customers.length, ...dataStore.data.customers);
payments.splice(0, payments.length, ...dataStore.data.payments);
settings = {
  taxRate: 0,
  lowStockThreshold: 10,
  receiptFooter: "Thank you for choosing our pharmacy.",
  ...dataStore.data.settings,
};
supportTickets.splice(0, supportTickets.length, ...(dataStore.data.supportTickets ?? []));
suppliers.splice(
  0,
  suppliers.length,
  ...(dataStore.data.suppliers ??
    [...new Set(products.map((product) => product.supplier).filter(Boolean))]
      .map((name, index) => ({
        id: index + 1,
        name: name!,
        email: "",
        phone: "",
        address: "",
        status: "Active" as const,
        balance: 0,
        createdAt: new Date().toISOString(),
      }))),
);
purchases.splice(0, purchases.length, ...(dataStore.data.purchases ?? []));
inventoryMovements.splice(
  0,
  inventoryMovements.length,
  ...(dataStore.data.inventoryMovements ?? []),
);
returns.splice(0, returns.length, ...(dataStore.data.returns ?? []));
auditEvents.splice(0, auditEvents.length, ...(dataStore.data.auditEvents ?? []));

const persistData = () =>
  dataStore.save({
    products,
    categories,
    orders,
    sales,
    customers,
    payments,
    settings,
    supportTickets,
    suppliers,
    purchases,
    inventoryMovements,
    returns,
    auditEvents,
  });

const nextId = (items: { id: number }[]) =>
  items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
const dateLabel = () => new Date().toISOString();
const getId = (req: Request) => Number(req.params.id);
const sendBadRequest = (res: Response, error: unknown) =>
  res
    .status(400)
    .json({
      error: error instanceof Error ? error.message : "Invalid request",
    });

const actorName = (res: Response) =>
  String(res.locals.user?.email ?? "authenticated-user");

const recordAudit = (
  res: Response,
  action: string,
  entity: string,
  entityId?: string | number,
  details?: string,
) => {
  auditEvents.unshift({
    id: nextId(auditEvents),
    action,
    entity,
    entityId: entityId === undefined ? undefined : String(entityId),
    actor: actorName(res),
    details,
    createdAt: dateLabel(),
  });
  if (auditEvents.length > 5000) auditEvents.length = 5000;
};

const productStatus = (product: Product) => {
  if (product.stock <= 0) return "Out of stock";
  if (product.stock <= (product.reorderLevel ?? settings.lowStockThreshold ?? 10))
    return "Low stock";
  return "In stock";
};

const findProduct = (value: string | number) => {
  if (typeof value === "number")
    return products.find((product) => product.id === value);
  const normalized = value.trim().toLowerCase();
  return products.find(
    (product) =>
      product.name.toLowerCase() === normalized ||
      product.sku.toLowerCase() === normalized ||
      product.barcode?.toLowerCase() === normalized,
  );
};

const moveStock = (
  product: Product,
  quantity: number,
  type: InventoryMovement["type"],
  reference: string,
  note?: string,
) => {
  const nextStock = product.stock + quantity;
  if (nextStock < 0)
    throw new Error(`Insufficient stock for ${product.name}`);
  product.stock = nextStock;
  product.status = productStatus(product);
  inventoryMovements.unshift({
    id: nextId(inventoryMovements),
    productId: product.id,
    product: product.name,
    type,
    quantity,
    balanceAfter: nextStock,
    reference,
    note,
    createdAt: dateLabel(),
  });
};

const reverseCompletedOrder = (order: Order) => {
  const linkedSales = sales.filter((sale) => sale.orderId === order.id);
  for (const sale of linkedSales) {
    const product = findProduct(sale.product);
    if (product)
      moveStock(
        product,
        sale.quantity,
        "Order reversal",
        order.receiptNumber ?? `ORDER-${order.id}`,
      );
  }
  for (let index = sales.length - 1; index >= 0; index -= 1)
    if (sales[index].orderId === order.id) sales.splice(index, 1);
  for (let index = payments.length - 1; index >= 0; index -= 1)
    if (payments[index].orderId === order.id) payments.splice(index, 1);
};

const completeOrder = (order: Order) => {
  if (sales.some((sale) => sale.orderId === order.id)) return;
  const product = findProduct(order.product);
  if (!product) throw new Error("Selected product does not exist");
  moveStock(
    product,
    -order.quantity,
    "Sale",
    order.receiptNumber ?? `ORDER-${order.id}`,
  );
  const sale: Sale = {
    id: nextId(sales),
    orderId: order.id,
    receiptNumber: order.receiptNumber,
    customer: order.customer,
    product: product.name,
    category: product.category,
    quantity: order.quantity,
    total: order.total,
    date: order.date,
    paymentMethod: order.paymentMethod,
    cost: (product.cost ?? 0) * order.quantity,
    status: "Completed",
  };
  sales.unshift(sale);
  payments.unshift({
    id: nextId(payments),
    orderId: order.id,
    saleId: sale.id,
    customer: order.customer,
    amount: order.total,
    method: order.paymentMethod,
    status: "Paid",
    date: order.date,
    reference: order.receiptNumber ?? `PAY-${order.id}`,
  });
};

const router: IRouter = Router();

router.use((req, res, next) => {
  const role = String(res.locals.user?.role ?? "");
  if (role === "Owner" || role === "Manager") return next();
  if (req.method === "GET") return next();
  const path = req.path;
  const allowed =
    (role === "Cashier" &&
      ["/orders", "/sales", "/payments", "/pos", "/returns", "/customers"].some(
        (prefix) => path.startsWith(prefix),
      )) ||
    (role === "Pharmacist" &&
      ["/orders", "/sales", "/payments", "/pos", "/returns", "/customers", "/products"].some(
        (prefix) => path.startsWith(prefix),
      )) ||
    (role === "Inventory" &&
      ["/products", "/categories", "/suppliers", "/purchases", "/inventory"].some(
        (prefix) => path.startsWith(prefix),
      )) ||
    (role === "Accountant" && path.startsWith("/payments"));
  if (!allowed)
    return res.status(403).json({ error: "Insufficient permissions" });
  return next();
});

router.get("/dashboard", (_req, res) => {
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const today = new Date().toISOString().slice(0, 10);
  const salesToday = sales
    .filter((sale) => sale.date.slice(0, 10) === today)
    .reduce((sum, sale) => sum + sale.total, 0);
  const weeklySales = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (5 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      value: sales
        .filter((sale) => sale.date.slice(0, 10) === key)
        .reduce((sum, sale) => sum + sale.total, 0),
    };
  });
  const response = {
    sales: salesToday,
    categories: categories.length,
    expired: products.filter((product) => new Date(product.expiry) < new Date()).length,
    users: customers.length,
    totalSales,
    weeklySales,
  };
  res.json(GetDashboardResponse.parse(response));
});

router.get("/products", (_req, res) => res.json(products));
router.post("/products", (req, res) => {
  try {
    const body = CreateProductBody.parse(req.body);
    if (
      products.some(
        (item) => item.sku.toLowerCase() === body.sku.trim().toLowerCase(),
      )
    )
      throw new Error("SKU already exists");
    const product: Product = {
      id: nextId(products),
      ...body,
      status: body.status ?? "In stock",
      cost: Number(req.body?.cost ?? 0),
      barcode: String(req.body?.barcode ?? "").trim() || undefined,
      batchNumber: String(req.body?.batchNumber ?? "").trim() || undefined,
      reorderLevel: Number(req.body?.reorderLevel ?? settings.lowStockThreshold ?? 10),
      unit: String(req.body?.unit ?? "Pack").trim(),
    };
    product.status = productStatus(product);
    products.unshift(product);
    if (product.stock)
      inventoryMovements.unshift({
        id: nextId(inventoryMovements),
        productId: product.id,
        product: product.name,
        type: "Opening",
        quantity: product.stock,
        balanceAfter: product.stock,
        reference: `OPENING-${product.id}`,
        createdAt: dateLabel(),
      });
    recordAudit(res, "create", "product", product.id, product.name);
    persistData();
    return res.status(201).json(product);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.patch("/products/:id", (req, res) => {
  try {
    const { id } = UpdateProductParams.parse(req.params);
    const body = UpdateProductBody.parse(req.body);
    const item = products.find((product) => product.id === id);
    if (!item) return res.status(404).json({ error: "Product not found" });
    const oldName = item.name;
    const oldStock = item.stock;
    Object.assign(item, body);
    if (req.body?.cost !== undefined) item.cost = Number(req.body.cost);
    if (req.body?.barcode !== undefined)
      item.barcode = String(req.body.barcode).trim() || undefined;
    if (req.body?.batchNumber !== undefined)
      item.batchNumber = String(req.body.batchNumber).trim() || undefined;
    if (req.body?.reorderLevel !== undefined)
      item.reorderLevel = Number(req.body.reorderLevel);
    if (req.body?.unit !== undefined)
      item.unit = String(req.body.unit).trim();
    if (body.stock !== undefined && body.stock !== oldStock) {
      item.stock = oldStock;
      moveStock(
        item,
        body.stock - oldStock,
        "Adjustment",
        `PRODUCT-${item.id}`,
        "Manual product update",
      );
    } else {
      item.status = productStatus(item);
    }
    if (item.name !== oldName) {
      orders.forEach((order) => { if (order.product === oldName) order.product = item.name; });
      sales.forEach((sale) => { if (sale.product === oldName) sale.product = item.name; });
    }
    recordAudit(res, "update", "product", item.id, item.name);
    persistData();
    return res.json(item);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.delete("/products/:id", (req, res) => {
  const id = getId(req);
  const index = products.findIndex((product) => product.id === id);
  if (index < 0) return res.status(404).json({ error: "Product not found" });
  recordAudit(res, "delete", "product", products[index].id, products[index].name);
  products.splice(index, 1);
  persistData();
  return res.status(204).send();
});

const categoriesWithMetrics = () => categories.map((category) => ({
  ...category,
  productCount: products.filter((product) => product.category === category.name).length,
  sales: sales.filter((sale) => sale.category === category.name).reduce((sum, sale) => sum + sale.total, 0),
}));

router.get("/categories", (_req, res) => res.json(categoriesWithMetrics()));
router.post("/categories", (req, res) => {
  try {
    const body = CreateCategoryBody.parse(req.body);
    const category: Category = {
      id: nextId(categories),
      name: body.name,
      productCount: 0,
      sales: 0,
      color: body.color ?? "#70D6C7",
    };
    categories.unshift(category);
    persistData();
    return res.status(201).json(category);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.patch("/categories/:id", (req, res) => {
  try {
    const { id } = UpdateCategoryParams.parse(req.params);
    const body = UpdateCategoryBody.parse(req.body);
    const item = categories.find((category) => category.id === id);
    if (!item) return res.status(404).json({ error: "Category not found" });
    const oldName = item.name;
    Object.assign(item, body);
    if (item.name !== oldName) {
      products.forEach((product) => { if (product.category === oldName) product.category = item.name; });
      sales.forEach((sale) => { if (sale.category === oldName) sale.category = item.name; });
    }
    persistData();
    return res.json(item);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.delete("/categories/:id", (req, res) => {
  const id = getId(req);
  const index = categories.findIndex((category) => category.id === id);
  if (index < 0) return res.status(404).json({ error: "Category not found" });
  const categoryName = categories[index].name;
  if (products.some((product) => product.category === categoryName) || sales.some((sale) => sale.category === categoryName))
    return res.status(409).json({ error: "Category is used by products or sales" });
  categories.splice(index, 1);
  persistData();
  return res.status(204).send();
});

router.get("/orders", (_req, res) => res.json(orders));
router.post("/orders", (req, res) => {
  try {
    const body = CreateOrderBody.parse(req.body);
    if (body.quantity <= 0 || body.total < 0)
      throw new Error("Quantity and total must be valid positive values");
    const order: Order = {
      id: nextId(orders),
      date: dateLabel(),
      status: body.status ?? "Pending",
      receiptNumber: `ORD-${Date.now()}`,
      ...body,
    };
    if (!findProduct(order.product))
      throw new Error("Selected product does not exist");
    orders.unshift(order);
    if (order.status === "Completed") completeOrder(order);
    recordAudit(res, "create", "order", order.id, order.receiptNumber);
    persistData();
    return res.status(201).json(order);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.patch("/orders/:id", (req, res) => {
  try {
    const { id } = UpdateOrderParams.parse(req.params);
    const body = UpdateOrderBody.parse(req.body);
    const item = orders.find((order) => order.id === id);
    if (!item) return res.status(404).json({ error: "Order not found" });
    const candidate: Order = { ...item, ...body };
    if (candidate.quantity <= 0 || candidate.total < 0)
      throw new Error("Quantity and total must be valid positive values");
    const nextProduct = findProduct(candidate.product);
    if (!nextProduct) throw new Error("Selected product does not exist");
    const wasCompleted = item.status === "Completed";
    if (candidate.status === "Completed") {
      const restorableQuantity = wasCompleted
        ? sales
            .filter(
              (sale) =>
                sale.orderId === item.id &&
                findProduct(sale.product)?.id === nextProduct.id,
            )
            .reduce((sum, sale) => sum + sale.quantity, 0)
        : 0;
      if (nextProduct.stock + restorableQuantity < candidate.quantity)
        throw new Error(`Insufficient stock for ${nextProduct.name}`);
    }
    if (wasCompleted) reverseCompletedOrder(item);
    Object.assign(item, candidate);
    if (item.status === "Completed") completeOrder(item);
    recordAudit(res, "update", "order", item.id, item.status);
    persistData();
    return res.json(item);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.delete("/orders/:id", (req, res) => {
  const id = getId(req);
  const index = orders.findIndex((order) => order.id === id);
  if (index < 0) return res.status(404).json({ error: "Order not found" });
  if (orders[index].status === "Completed") reverseCompletedOrder(orders[index]);
  recordAudit(res, "delete", "order", orders[index].id);
  orders.splice(index, 1);
  persistData();
  return res.status(204).send();
});

router.get("/sales", (_req, res) => res.json(sales));
router.post("/sales", (req, res) => {
  try {
    const body = CreateSaleBody.parse(req.body);
    if (body.quantity <= 0 || body.total < 0)
      throw new Error("Quantity and total must be valid positive values");
    const product = findProduct(body.product);
    if (!product) throw new Error("Selected product does not exist");
    const receiptNumber = `SALE-${Date.now()}`;
    moveStock(product, -body.quantity, "Sale", receiptNumber);
    const sale: Sale = {
      id: nextId(sales),
      date: body.date ?? dateLabel(),
      ...body,
      product: product.name,
      category: product.category,
      receiptNumber,
      cost: (product.cost ?? 0) * body.quantity,
      status: "Completed",
    };
    sales.unshift(sale);
    recordAudit(res, "create", "sale", sale.id, receiptNumber);
    persistData();
    return res.status(201).json(sale);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.patch("/sales/:id", (req, res) => {
  try {
    const { id } = UpdateSaleParams.parse(req.params);
    const body = UpdateSaleBody.parse(req.body);
    const item = sales.find((sale) => sale.id === id);
    if (!item) return res.status(404).json({ error: "Sale not found" });
    const candidate: Sale = { ...item, ...body };
    if (candidate.quantity <= 0 || candidate.total < 0)
      throw new Error("Quantity and total must be valid positive values");
    const oldProduct = findProduct(item.product);
    const product = findProduct(candidate.product);
    if (!product) throw new Error("Selected product does not exist");
    const restorableQuantity = oldProduct?.id === product.id ? item.quantity : 0;
    if (product.stock + restorableQuantity < candidate.quantity)
      throw new Error(`Insufficient stock for ${product.name}`);
    if (oldProduct)
      moveStock(
        oldProduct,
        item.quantity,
        "Order reversal",
        item.receiptNumber ?? `SALE-${item.id}`,
        "Sale edited",
      );
    Object.assign(item, candidate);
    moveStock(
      product,
      -item.quantity,
      "Sale",
      item.receiptNumber ?? `SALE-${item.id}`,
      "Sale edited",
    );
    item.product = product.name;
    item.category = product.category;
    item.cost = (product.cost ?? 0) * item.quantity;
    recordAudit(res, "update", "sale", item.id);
    persistData();
    return res.json(item);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.delete("/sales/:id", (req, res) => {
  const id = getId(req);
  const index = sales.findIndex((sale) => sale.id === id);
  if (index < 0) return res.status(404).json({ error: "Sale not found" });
  const product = findProduct(sales[index].product);
  if (product)
    moveStock(
      product,
      sales[index].quantity,
      "Order reversal",
      sales[index].receiptNumber ?? `SALE-${sales[index].id}`,
      "Sale deleted",
    );
  recordAudit(res, "delete", "sale", sales[index].id);
  sales.splice(index, 1);
  persistData();
  return res.status(204).send();
});

const customersWithMetrics = () => customers.map((customer) => ({
  ...customer,
  orders: orders.filter((order) => order.customer === customer.name).length,
  spent: sales.filter((sale) => sale.customer === customer.name).reduce((sum, sale) => sum + sale.total, 0),
}));

router.get("/customers", (_req, res) => res.json(customersWithMetrics()));
router.post("/customers", (req, res) => {
  try {
    const body = CreateCustomerBody.parse(req.body);
    const customer: Customer = {
      id: nextId(customers),
      orders: 0,
      spent: 0,
      status: body.status ?? "Active",
      loyaltyPoints: Number(req.body?.loyaltyPoints ?? 0),
      consent: Boolean(req.body?.consent),
      ...body,
    };
    customers.unshift(customer);
    recordAudit(res, "create", "customer", customer.id, customer.name);
    persistData();
    return res.status(201).json(customer);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.patch("/customers/:id", (req, res) => {
  try {
    const { id } = UpdateCustomerParams.parse(req.params);
    const body = UpdateCustomerBody.parse(req.body);
    const item = customers.find((customer) => customer.id === id);
    if (!item) return res.status(404).json({ error: "Customer not found" });
    const oldName = item.name;
    Object.assign(item, body);
    if (typeof req.body?.loyaltyPoints === "number")
      item.loyaltyPoints = Math.max(0, req.body.loyaltyPoints);
    if (typeof req.body?.consent === "boolean") item.consent = req.body.consent;
    if (item.name !== oldName) {
      orders.forEach((order) => { if (order.customer === oldName) order.customer = item.name; });
      sales.forEach((sale) => { if (sale.customer === oldName) sale.customer = item.name; });
      payments.forEach((payment) => { if (payment.customer === oldName) payment.customer = item.name; });
    }
    recordAudit(res, "update", "customer", item.id, item.name);
    persistData();
    return res.json(item);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.delete("/customers/:id", (req, res) => {
  const id = getId(req);
  const index = customers.findIndex((customer) => customer.id === id);
  if (index < 0) return res.status(404).json({ error: "Customer not found" });
  const customerName = customers[index].name;
  if (orders.some((order) => order.customer === customerName) || sales.some((sale) => sale.customer === customerName) || payments.some((payment) => payment.customer === customerName))
    return res.status(409).json({ error: "Customer has linked transactions" });
  recordAudit(res, "delete", "customer", customers[index].id, customerName);
  customers.splice(index, 1);
  persistData();
  return res.status(204).send();
});

router.get("/payments", (_req, res) => res.json(payments));
router.post("/payments", (req, res) => {
  try {
    const body = CreatePaymentBody.parse(req.body);
    const payment: Payment = {
      id: nextId(payments),
      date: dateLabel(),
      reference: `PAY-${Date.now()}`,
      status: body.status ?? "Paid",
      ...body,
    };
    payments.unshift(payment);
    recordAudit(res, "create", "payment", payment.id, payment.reference);
    persistData();
    res.status(201).json(payment);
  } catch (error) {
    sendBadRequest(res, error);
  }
});

router.patch("/payments/:id", (req, res) => {
  const payment = payments.find((item) => item.id === getId(req));
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  const allowedStatuses = ["Paid", "Pending", "Failed", "Refunded"];
  const status = String(req.body?.status ?? payment.status);
  if (!allowedStatuses.includes(status))
    return res.status(400).json({ error: "Invalid payment status" });
  payment.status = status;
  recordAudit(res, "update", "payment", payment.id, status);
  persistData();
  return res.json(payment);
});

router.get("/suppliers", (_req, res) => res.json(suppliers));
router.post("/suppliers", (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    if (!name) throw new Error("Supplier name is required");
    if (suppliers.some((item) => item.name.toLowerCase() === name.toLowerCase()))
      throw new Error("Supplier already exists");
    const supplier: Supplier = {
      id: nextId(suppliers),
      name,
      email: String(req.body?.email ?? "").trim(),
      phone: String(req.body?.phone ?? "").trim(),
      address: String(req.body?.address ?? "").trim(),
      status: req.body?.status === "Inactive" ? "Inactive" : "Active",
      balance: Number(req.body?.balance ?? 0),
      createdAt: dateLabel(),
    };
    suppliers.unshift(supplier);
    recordAudit(res, "create", "supplier", supplier.id, supplier.name);
    persistData();
    return res.status(201).json(supplier);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.patch("/suppliers/:id", (req, res) => {
  const supplier = suppliers.find((item) => item.id === getId(req));
  if (!supplier) return res.status(404).json({ error: "Supplier not found" });
  for (const key of ["name", "email", "phone", "address"] as const)
    if (typeof req.body?.[key] === "string")
      supplier[key] = req.body[key].trim();
  if (req.body?.status === "Active" || req.body?.status === "Inactive")
    supplier.status = req.body.status;
  recordAudit(res, "update", "supplier", supplier.id, supplier.name);
  persistData();
  return res.json(supplier);
});
router.delete("/suppliers/:id", (req, res) => {
  const index = suppliers.findIndex((item) => item.id === getId(req));
  if (index < 0) return res.status(404).json({ error: "Supplier not found" });
  if (purchases.some((purchase) => purchase.supplierId === suppliers[index].id))
    return res.status(409).json({ error: "Supplier has linked purchases" });
  recordAudit(res, "delete", "supplier", suppliers[index].id, suppliers[index].name);
  suppliers.splice(index, 1);
  persistData();
  return res.status(204).send();
});

router.get("/purchases", (_req, res) => res.json(purchases));
router.post("/purchases", (req, res) => {
  try {
    const supplierId = Number(req.body?.supplierId);
    const supplier = suppliers.find((item) => item.id === supplierId);
    if (!supplier || supplier.status !== "Active")
      throw new Error("An active supplier is required");
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!rawItems.length) throw new Error("At least one purchase item is required");
    const items: PurchaseItem[] = rawItems.map((raw: any) => {
      const product = findProduct(Number(raw.productId));
      const quantity = Number(raw.quantity);
      const cost = Number(raw.cost);
      if (!product) throw new Error("A purchase product does not exist");
      if (!Number.isInteger(quantity) || quantity <= 0 || cost < 0)
        throw new Error("Purchase quantities and costs must be valid");
      return {
        productId: product.id,
        product: product.name,
        quantity,
        cost,
        batchNumber: String(raw.batchNumber ?? "").trim() || undefined,
        expiry: String(raw.expiry ?? "").trim() || undefined,
      };
    });
    const status: Purchase["status"] =
      req.body?.status === "Received" ? "Received" : "Ordered";
    const purchase: Purchase = {
      id: nextId(purchases),
      reference: `PO-${Date.now()}`,
      supplierId,
      supplier: supplier.name,
      items,
      subtotal: items.reduce((sum, item) => sum + item.quantity * item.cost, 0),
      status,
      createdAt: dateLabel(),
      receivedAt: status === "Received" ? dateLabel() : undefined,
    };
    if (status === "Received") {
      for (const item of items) {
        const product = findProduct(item.productId)!;
        moveStock(product, item.quantity, "Purchase", purchase.reference);
        product.cost = item.cost;
        product.supplier = supplier.name;
        if (item.batchNumber) product.batchNumber = item.batchNumber;
        if (item.expiry) product.expiry = item.expiry;
      }
      supplier.balance += purchase.subtotal;
    }
    purchases.unshift(purchase);
    recordAudit(res, "create", "purchase", purchase.id, purchase.reference);
    persistData();
    return res.status(201).json(purchase);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});
router.patch("/purchases/:id/receive", (req, res) => {
  try {
    const purchase = purchases.find((item) => item.id === getId(req));
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    if (purchase.status === "Received")
      throw new Error("Purchase has already been received");
    if (purchase.status === "Cancelled")
      throw new Error("Cancelled purchase cannot be received");
    const supplier = suppliers.find((item) => item.id === purchase.supplierId);
    if (!supplier) throw new Error("Purchase supplier does not exist");
    for (const item of purchase.items) {
      const product = findProduct(item.productId);
      if (!product) throw new Error(`Product ${item.product} does not exist`);
      moveStock(product, item.quantity, "Purchase", purchase.reference);
      product.cost = item.cost;
      product.supplier = supplier.name;
      if (item.batchNumber) product.batchNumber = item.batchNumber;
      if (item.expiry) product.expiry = item.expiry;
    }
    purchase.status = "Received";
    purchase.receivedAt = dateLabel();
    supplier.balance += purchase.subtotal;
    recordAudit(res, "receive", "purchase", purchase.id, purchase.reference);
    persistData();
    return res.json(purchase);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});

router.get("/inventory/movements", (_req, res) =>
  res.json(inventoryMovements),
);
router.post("/inventory/adjustments", (req, res) => {
  try {
    const product = findProduct(
      typeof req.body?.productId === "number"
        ? req.body.productId
        : String(req.body?.product ?? ""),
    );
    const quantity = Number(req.body?.quantity);
    if (!product) throw new Error("Product not found");
    if (!Number.isInteger(quantity) || quantity === 0)
      throw new Error("Adjustment quantity must be a non-zero integer");
    moveStock(
      product,
      quantity,
      "Adjustment",
      `ADJ-${Date.now()}`,
      String(req.body?.note ?? "").trim() || undefined,
    );
    recordAudit(res, "adjust", "inventory", product.id, String(quantity));
    persistData();
    return res.json(product);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});

router.post("/pos/checkout", (req, res) => {
  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!rawItems.length) throw new Error("Cart is empty");
    const customer = String(req.body?.customer ?? "Walk-in Customer").trim();
    const paymentMethod = String(req.body?.paymentMethod ?? "Cash").trim();
    const discount = Math.max(0, Number(req.body?.discount ?? 0));
    const taxRate = Math.max(0, Number(req.body?.taxRate ?? settings.taxRate ?? 0));
    const items: Array<{
      product: Product;
      quantity: number;
      lineTotal: number;
    }> = rawItems.map((raw: any) => {
      const product = findProduct(
        typeof raw.productId === "number" ? raw.productId : String(raw.code ?? ""),
      );
      const quantity = Number(raw.quantity);
      if (!product) throw new Error("A cart product does not exist");
      if (!Number.isInteger(quantity) || quantity <= 0)
        throw new Error("Cart quantity must be a positive integer");
      if (product.stock < quantity)
        throw new Error(`Insufficient stock for ${product.name}`);
      return { product, quantity, lineTotal: product.price * quantity };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    if (discount > subtotal) throw new Error("Discount cannot exceed subtotal");
    const tax = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + tax;
    const receiptNumber = `REC-${Date.now()}`;
    const createdAt = dateLabel();
    const createdSales: Sale[] = [];
    for (const item of items) {
      moveStock(item.product, -item.quantity, "Sale", receiptNumber);
      const order: Order = {
        id: nextId(orders),
        customer,
        product: item.product.name,
        paymentMethod,
        quantity: item.quantity,
        total: item.lineTotal,
        status: "Completed",
        date: createdAt,
        receiptNumber,
      };
      orders.unshift(order);
      const sale: Sale = {
        id: nextId(sales),
        orderId: order.id,
        receiptNumber,
        customer,
        product: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        total: item.lineTotal,
        date: createdAt,
        paymentMethod,
        cost: (item.product.cost ?? 0) * item.quantity,
        status: "Completed",
      };
      sales.unshift(sale);
      createdSales.push(sale);
    }
    const payment: Payment = {
      id: nextId(payments),
      saleId: createdSales[0]?.id,
      customer,
      amount: total,
      method: paymentMethod,
      status: "Paid",
      date: createdAt,
      reference: receiptNumber,
    };
    payments.unshift(payment);
    recordAudit(
      res,
      "checkout",
      "pos",
      receiptNumber,
      `${items.length} line(s), total ${total.toFixed(2)}`,
    );
    persistData();
    return res.status(201).json({
      receiptNumber,
      customer,
      items: createdSales,
      subtotal,
      discount,
      tax,
      total,
      payment,
      createdAt,
      receiptFooter: settings.receiptFooter,
    });
  } catch (error) {
    return sendBadRequest(res, error);
  }
});

router.get("/returns", (_req, res) => res.json(returns));
router.post("/returns", (req, res) => {
  try {
    const saleId = Number(req.body?.saleId);
    const quantity = Number(req.body?.quantity);
    const reason = String(req.body?.reason ?? "").trim();
    const sale = sales.find((item) => item.id === saleId);
    if (!sale) throw new Error("Sale not found");
    if (!Number.isInteger(quantity) || quantity <= 0)
      throw new Error("Return quantity must be a positive integer");
    const returnedQuantity = returns
      .filter((item) => item.saleId === saleId)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (returnedQuantity + quantity > sale.quantity)
      throw new Error("Return quantity exceeds sold quantity");
    if (!reason) throw new Error("Return reason is required");
    const product = findProduct(sale.product);
    if (!product) throw new Error("Sale product no longer exists");
    const amount = (sale.total / sale.quantity) * quantity;
    const record: ReturnRecord = {
      id: nextId(returns),
      saleId,
      productId: product.id,
      product: product.name,
      customer: sale.customer,
      quantity,
      amount,
      reason,
      status: "Completed",
      createdAt: dateLabel(),
    };
    moveStock(product, quantity, "Return", `RET-${record.id}`, reason);
    returns.unshift(record);
    payments.unshift({
      id: nextId(payments),
      saleId,
      customer: sale.customer,
      amount: -amount,
      method: sale.paymentMethod ?? "Original method",
      status: "Refunded",
      date: record.createdAt,
      reference: `REFUND-${record.id}`,
    });
    recordAudit(res, "return", "sale", sale.id, reason);
    persistData();
    return res.status(201).json(record);
  } catch (error) {
    return sendBadRequest(res, error);
  }
});

router.get("/notifications", (_req, res) => {
  const nowTime = Date.now();
  const expiryWindow = 1000 * 60 * 60 * 24 * 90;
  const notifications = products.flatMap((product) => {
    const entries = [];
    if (product.stock <= (product.reorderLevel ?? settings.lowStockThreshold ?? 10))
      entries.push({
        id: `stock-${product.id}`,
        type: "stock",
        severity: product.stock === 0 ? "critical" : "warning",
        title: product.stock === 0 ? "Out of stock" : "Low stock",
        message: `${product.name} has ${product.stock} ${product.unit ?? "unit"}(s) left`,
        productId: product.id,
      });
    const expiryTime = new Date(product.expiry).getTime();
    if (Number.isFinite(expiryTime) && expiryTime - nowTime <= expiryWindow)
      entries.push({
        id: `expiry-${product.id}`,
        type: "expiry",
        severity: expiryTime < nowTime ? "critical" : "warning",
        title: expiryTime < nowTime ? "Expired medicine" : "Expiry approaching",
        message: `${product.name} expires on ${product.expiry}`,
        productId: product.id,
      });
    return entries;
  });
  res.json(notifications);
});

router.get("/integrations/eptts/products.csv", (_req, res) => {
  const role = String(res.locals.user?.role ?? "");
  if (!["Owner", "Manager", "Inventory"].includes(role))
    return res.status(403).json({ error: "Insufficient permissions" });
  const quoteCsv = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = products.map((product) =>
    [
      product.barcode,
      product.sku,
      product.name,
      product.batchNumber,
      product.expiry,
      product.stock,
      product.unit,
    ]
      .map(quoteCsv)
      .join(","),
  );
  res.type("text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="eptts-products-${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  return res.send(
    [
      "GTIN_OR_BARCODE,SKU,PRODUCT_NAME,BATCH_NUMBER,EXPIRY_DATE,QUANTITY,UNIT",
      ...rows,
    ].join("\n"),
  );
});

router.get("/audit-log", (_req, res) => res.json(auditEvents));

router.get("/backup/export", (_req, res) => {
  const snapshot = dataStore.data;
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="pharmacy-backup-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  res.json({
    version: 1,
    exportedAt: dateLabel(),
    data: snapshot,
  });
});

router.post("/backup/restore", (req, res) => {
  try {
    if (req.body?.confirmation !== "RESTORE")
      throw new Error("Restore confirmation is required");
    const snapshot = req.body?.backup?.data as PharmacyData | undefined;
    if (
      !snapshot ||
      !Array.isArray(snapshot.products) ||
      !Array.isArray(snapshot.orders) ||
      !Array.isArray(snapshot.sales)
    )
      throw new Error("Invalid backup file");
    products.splice(0, products.length, ...snapshot.products);
    categories.splice(0, categories.length, ...snapshot.categories);
    orders.splice(0, orders.length, ...snapshot.orders);
    sales.splice(0, sales.length, ...snapshot.sales);
    customers.splice(0, customers.length, ...snapshot.customers);
    payments.splice(0, payments.length, ...snapshot.payments);
    settings = snapshot.settings;
    supportTickets.splice(0, supportTickets.length, ...(snapshot.supportTickets ?? []));
    suppliers.splice(0, suppliers.length, ...(snapshot.suppliers ?? []));
    purchases.splice(0, purchases.length, ...(snapshot.purchases ?? []));
    inventoryMovements.splice(
      0,
      inventoryMovements.length,
      ...(snapshot.inventoryMovements ?? []),
    );
    returns.splice(0, returns.length, ...(snapshot.returns ?? []));
    auditEvents.splice(0, auditEvents.length, ...(snapshot.auditEvents ?? []));
    recordAudit(res, "restore", "backup", undefined, "Backup restored");
    persistData();
    return res.json({ restored: true, restoredAt: dateLabel() });
  } catch (error) {
    return sendBadRequest(res, error);
  }
});

router.get("/support-tickets", (_req, res) => res.json(supportTickets));
router.post("/support-tickets", (req, res) => {
  try {
    const subject = String(req.body?.subject ?? "").trim();
    const message = String(req.body?.message ?? "").trim();
    const contact = String(req.body?.contact ?? "").trim();
    if (!subject || !message || !contact) {
      throw new Error("Subject, message and contact are required");
    }
    if (subject.length > 100 || message.length > 2000 || contact.length > 160) {
      throw new Error("Support request is too long");
    }
    const ticket: SupportTicket = {
      id: nextId(supportTickets),
      subject,
      message,
      contact,
      status: "Open",
      createdAt: dateLabel(),
    };
    supportTickets.unshift(ticket);
    persistData();
    res.status(201).json(ticket);
  } catch (error) {
    sendBadRequest(res, error);
  }
});
router.delete("/support-tickets/:id", (req, res) => {
  const id = getId(req);
  const index = supportTickets.findIndex((ticket) => ticket.id === id);
  if (index < 0) return res.status(404).json({ error: "Support ticket not found" });
  supportTickets.splice(index, 1);
  persistData();
  return res.status(204).send();
});

router.get("/reports/summary", (_req, res) => {
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const byCategory = categories.map((category) => ({
    label: category.name,
    value: sales
      .filter((sale) => sale.category === category.name)
      .reduce((sum, sale) => sum + sale.total, 0),
  }));
  res.json(
    GetReportsSummaryResponse.parse({
      revenue,
      orders: orders.length,
      averageOrder: orders.length ? revenue / orders.length : 0,
      byCategory,
    }),
  );
});

router.get("/settings", (_req, res) =>
  res.json(GetSettingsResponse.parse(settings)),
);
router.patch("/settings", (req, res) => {
  try {
    const body = UpdateSettingsBody.parse(req.body);
    settings = { ...settings, ...body };
    persistData();
    res.json(settings);
  } catch (error) {
    sendBadRequest(res, error);
  }
});

export default router;
