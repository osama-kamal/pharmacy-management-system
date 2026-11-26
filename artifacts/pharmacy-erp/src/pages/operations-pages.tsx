import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArchiveRestore,
  BellRing,
  Download,
  PackagePlus,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Upload,
  UserPlus,
} from "lucide-react";
import {
  Button,
  EmptyState,
  Feedback,
  Field,
  PageHeading,
  Panel,
  SelectField,
  StatusPill,
} from "@/components/ui-kit";

type Product = {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  stock: number;
  price: number;
  category: string;
  unit?: string;
};
type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  balance: number;
};
type Purchase = {
  id: number;
  reference: string;
  supplier: string;
  subtotal: number;
  status: string;
  createdAt: string;
};
type Movement = {
  id: number;
  product: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  reference: string;
  createdAt: string;
};
type Sale = {
  id: number;
  customer: string;
  product: string;
  quantity: number;
  total: number;
};
type ReturnRecord = {
  id: number;
  product: string;
  customer: string;
  quantity: number;
  amount: number;
  reason: string;
  createdAt: string;
};
type Notification = {
  id: string;
  severity: string;
  title: string;
  message: string;
};
type TeamUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
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

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(data?.error ?? `Request failed with ${response.status}`);
  return data as T;
}

function useRemote<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      setData(await api<T>(path));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [path]);
  return { data, loading, reload: load };
}

function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-[11px]">
        <thead className="border-b border-border text-[9px] uppercase tracking-wide text-muted-foreground">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border/65">{children}</tbody>
      </table>
    </div>
  );
}

const td = "px-4 py-3 align-middle";
const money = (value: number) =>
  new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP" }).format(value);

export function PosPage() {
  const productsQuery = useRemote<Product[]>("/products", []);
  const settingsQuery = useRemote<{ taxRate?: number; pharmacyName?: string }>("/settings", {});
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [productId, setProductId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("0");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountedSubtotal = Math.max(0, subtotal - (Number(discount) || 0));
  const estimatedTax = discountedSubtotal * ((settingsQuery.data.taxRate ?? 0) / 100);

  const putInCart = (product?: Product) => {
    if (!product || product.stock <= 0) {
      setMessage("Product was not found or is out of stock");
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (!existing) return [...current, { product, quantity: 1 }];
      if (existing.quantity >= product.stock) return current;
      return current.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
    setMessage(`${product.name} added`);
  };

  const addProduct = () => {
    const product = productsQuery.data.find((item) => item.id === Number(productId));
    putInCart(product);
  };
  const scanBarcode = () => {
    const code = barcode.trim().toLowerCase();
    const product = productsQuery.data.find(
      (item) =>
        item.barcode?.toLowerCase() === code || item.sku.toLowerCase() === code,
    );
    putInCart(product);
    if (product) setBarcode("");
  };
  const checkout = async () => {
    try {
      const result = await api<any>("/pos/checkout", {
        method: "POST",
        body: JSON.stringify({
          customer,
          paymentMethod,
          discount: Number(discount),
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });
      setReceipt(result);
      setCart([]);
      setMessage(`Sale completed — ${result.receiptNumber}`);
      await productsQuery.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed");
    }
  };
  const printReceipt = () => {
    if (!receipt) {
      setMessage("Complete a sale before printing a receipt");
      return;
    }
    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll(String.fromCharCode(34), "&quot;")
        .replaceAll(String.fromCharCode(39), "&#039;");
    const receiptWindow = window.open("", "pharmacy-receipt", "width=420,height=720");
    if (!receiptWindow) {
      setMessage("Allow pop-ups to print the receipt");
      return;
    }
    const lines = receipt.items
      .map(
        (item: Sale) =>
          `<tr><td>${escapeHtml(item.product)} × ${item.quantity}</td><td>${escapeHtml(money(item.total))}</td></tr>`,
      )
      .join("");
    receiptWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(receipt.receiptNumber)}</title><style>body{font:14px system-ui;margin:28px;color:#073f42}h1{text-align:center;font-size:22px}small{display:block;text-align:center;color:#587577}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:9px 0;border-bottom:1px dashed #bdd3d0}td:last-child{text-align:right}.total{font-size:18px;font-weight:700}.footer{text-align:center;margin-top:28px}</style></head><body><h1>${escapeHtml(settingsQuery.data.pharmacyName ?? "Pharmacy")}</h1><small>${escapeHtml(receipt.receiptNumber)} · ${escapeHtml(new Date(receipt.createdAt).toLocaleString())}</small><p>Customer: ${escapeHtml(receipt.customer)}</p><table>${lines}<tr><td>Subtotal</td><td>${escapeHtml(money(receipt.subtotal))}</td></tr><tr><td>Discount</td><td>-${escapeHtml(money(receipt.discount))}</td></tr><tr><td>Tax</td><td>${escapeHtml(money(receipt.tax))}</td></tr><tr class="total"><td>Total</td><td>${escapeHtml(money(receipt.total))}</td></tr></table><p>Payment: ${escapeHtml(receipt.payment.method)}</p><p class="footer">${escapeHtml(receipt.receiptFooter)}</p><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    receiptWindow.document.close();
  };
  return (
    <div>
      <PageHeading
        title="Point of Sale"
        description="Barcode-ready checkout with live stock validation, discounts, payments and printable receipts."
        action={<Button onClick={printReceipt}><Printer size={14} />Print receipt</Button>}
      />
      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Panel className="overflow-hidden">
          <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_1fr_auto]">
            <label>
              <span className="mb-1 block text-[10px] font-medium text-muted-foreground">Scan barcode or enter SKU</span>
              <input
                autoFocus
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    scanBarcode();
                  }
                }}
                placeholder="Scan and press Enter"
                className="h-11 w-full rounded-2xl border border-border bg-white/70 px-4 text-xs outline-none focus:border-primary"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-[10px] font-medium text-muted-foreground">Product list</span>
              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-white/70 px-4 text-xs outline-none"
              >
                <option value="">Select product / scan result</option>
                {productsQuery.data.map((product) => (
                  <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                    {product.name} — {product.sku} — {product.stock} available
                  </option>
                ))}
              </select>
            </label>
            <Button className="self-end" onClick={addProduct}><Plus size={14} />Add to cart</Button>
          </div>
          {cart.length ? (
            <DataTable headers={["Product", "Price", "Available", "Quantity", "Total", ""]}>
              {cart.map((item) => (
                <tr key={item.product.id}>
                  <td className={td}><b>{item.product.name}</b><p className="text-[9px] text-muted-foreground">{item.product.sku}</p></td>
                  <td className={td}>{money(item.product.price)}</td>
                  <td className={td}>{item.product.stock}</td>
                  <td className={td}>
                    <input
                      type="number"
                      min={1}
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(event) =>
                        setCart((current) =>
                          current.map((row) =>
                            row.product.id === item.product.id
                              ? { ...row, quantity: Math.max(1, Math.min(row.product.stock, Number(event.target.value))) }
                              : row,
                          ),
                        )
                      }
                      className="h-8 w-20 rounded-xl border border-border bg-white px-2"
                    />
                  </td>
                  <td className={td}>{money(item.product.price * item.quantity)}</td>
                  <td className={td}><Button variant="danger" onClick={() => setCart((rows) => rows.filter((row) => row.product.id !== item.product.id))}>Remove</Button></td>
                </tr>
              ))}
            </DataTable>
          ) : <EmptyState label="Add products to start a new sale." />}
        </Panel>
        <Panel className="h-fit p-5">
          <h3 className="text-lg font-semibold">Checkout summary</h3>
          <div className="mt-5 space-y-4">
            <Field label="Customer" value={customer} onChange={(e) => setCustomer(e.target.value)} />
            <SelectField label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={["Cash", "Card", "Wallet", "Insurance", "Transfer"]} />
            <Field label="Discount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            <div className="space-y-2 border-y border-border py-4 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><b>{money(subtotal)}</b></div>
              <div className="flex justify-between"><span>Discount</span><b>- {money(Number(discount) || 0)}</b></div>
              <div className="flex justify-between"><span>Tax ({settingsQuery.data.taxRate ?? 0}%)</span><b>{money(estimatedTax)}</b></div>
              <div className="flex justify-between text-base"><span>Total</span><b>{money(discountedSubtotal + estimatedTax)}</b></div>
            </div>
            <Button className="w-full" disabled={!cart.length} onClick={checkout}><ShoppingCart size={14} />Complete sale</Button>
          </div>
          {receipt && (
            <div className="mt-4 rounded-2xl bg-[#e8f7f5] p-4 text-xs">
              <b>{receipt.receiptNumber}</b>
              <p className="mt-1">Paid {money(receipt.total)} via {receipt.payment.method}</p>
            </div>
          )}
        </Panel>
      </div>
      {message && <Feedback message={message} />}
    </div>
  );
}

export function SupplyChainPage() {
  const suppliersQuery = useRemote<Supplier[]>("/suppliers", []);
  const purchasesQuery = useRemote<Purchase[]>("/purchases", []);
  const productsQuery = useRemote<Product[]>("/products", []);
  const [message, setMessage] = useState("");
  const [supplierForm, setSupplierForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: "", productId: "", quantity: "1", cost: "", batchNumber: "", expiry: "", status: "Ordered" });
  const addSupplier = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api("/suppliers", { method: "POST", body: JSON.stringify(supplierForm) });
      setSupplierForm({ name: "", email: "", phone: "", address: "" });
      await suppliersQuery.reload();
      setMessage("Supplier added");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not add supplier"); }
  };
  const addPurchase = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api("/purchases", {
        method: "POST",
        body: JSON.stringify({
          supplierId: Number(purchaseForm.supplierId),
          status: purchaseForm.status,
          items: [{
            productId: Number(purchaseForm.productId),
            quantity: Number(purchaseForm.quantity),
            cost: Number(purchaseForm.cost),
            batchNumber: purchaseForm.batchNumber,
            expiry: purchaseForm.expiry,
          }],
        }),
      });
      await Promise.all([purchasesQuery.reload(), suppliersQuery.reload(), productsQuery.reload()]);
      setMessage(purchaseForm.status === "Received" ? "Purchase received and stock updated" : "Purchase order created");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create purchase"); }
  };
  const receive = async (id: number) => {
    try {
      await api(`/purchases/${id}/receive`, { method: "PATCH" });
      await Promise.all([purchasesQuery.reload(), suppliersQuery.reload(), productsQuery.reload()]);
      setMessage("Purchase received and inventory updated");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not receive purchase"); }
  };
  return (
    <div>
      <PageHeading title="Suppliers & Purchasing" description="Manage suppliers, purchase orders, batches, costs and stock receiving." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><Truck size={17} />Add supplier</h3>
          <form onSubmit={addSupplier} className="grid gap-3 sm:grid-cols-2">
            <Field label="Supplier name" required value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
            <Field label="Email" type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
            <Field label="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
            <Field label="Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
            <Button className="sm:col-span-2" type="submit"><Plus size={14} />Save supplier</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><PackagePlus size={17} />New purchase order</h3>
          <form onSubmit={addPurchase} className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Supplier" required value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })} options={["", ...suppliersQuery.data.map((item) => String(item.id))]} optionLabels={Object.fromEntries([["", "Select supplier"], ...suppliersQuery.data.map((item) => [String(item.id), item.name])])} />
            <SelectField label="Product" required value={purchaseForm.productId} onChange={(e) => setPurchaseForm({ ...purchaseForm, productId: e.target.value })} options={["", ...productsQuery.data.map((item) => String(item.id))]} optionLabels={Object.fromEntries([["", "Select product"], ...productsQuery.data.map((item) => [String(item.id), `${item.name} — ${item.sku}`])])} />
            <Field label="Quantity" required type="number" min="1" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} />
            <Field label="Unit cost" required type="number" min="0" step="0.01" value={purchaseForm.cost} onChange={(e) => setPurchaseForm({ ...purchaseForm, cost: e.target.value })} />
            <Field label="Batch / lot" value={purchaseForm.batchNumber} onChange={(e) => setPurchaseForm({ ...purchaseForm, batchNumber: e.target.value })} />
            <Field label="Expiry" type="date" value={purchaseForm.expiry} onChange={(e) => setPurchaseForm({ ...purchaseForm, expiry: e.target.value })} />
            <SelectField label="Status" value={purchaseForm.status} onChange={(e) => setPurchaseForm({ ...purchaseForm, status: e.target.value })} options={["Ordered", "Received"]} />
            <Button type="submit"><Save size={14} />Save purchase</Button>
          </form>
          <p className="mt-3 text-[10px] text-muted-foreground">Supplier and product selectors use their stored IDs to prevent broken links.</p>
        </Panel>
      </div>
      <Panel className="mt-4 overflow-hidden">
        <div className="p-4"><h3 className="text-base font-semibold">Purchase orders</h3></div>
        {purchasesQuery.data.length ? (
          <DataTable headers={["Reference", "Supplier", "Total", "Status", "Date", ""]}>
            {purchasesQuery.data.map((purchase) => (
              <tr key={purchase.id}>
                <td className={td}><b>{purchase.reference}</b></td>
                <td className={td}>{purchase.supplier}</td>
                <td className={td}>{money(purchase.subtotal)}</td>
                <td className={td}><StatusPill status={purchase.status} /></td>
                <td className={td}>{new Date(purchase.createdAt).toLocaleDateString()}</td>
                <td className={td}>{purchase.status === "Ordered" && <Button onClick={() => receive(purchase.id)}>Receive stock</Button>}</td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState label="Create your first purchase order." />}
      </Panel>
      <Panel className="mt-4 overflow-hidden">
        <div className="p-4"><h3 className="text-base font-semibold">Supplier directory</h3></div>
        <DataTable headers={["Supplier", "Email", "Phone", "Balance", "Status"]}>
          {suppliersQuery.data.map((supplier) => (
            <tr key={supplier.id}>
              <td className={td}><b>{supplier.name}</b></td>
              <td className={td}>{supplier.email || "—"}</td>
              <td className={td}>{supplier.phone || "—"}</td>
              <td className={td}>{money(supplier.balance)}</td>
              <td className={td}><StatusPill status={supplier.status} /></td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      {message && <Feedback message={message} />}
    </div>
  );
}

export function InventoryControlPage() {
  const productsQuery = useRemote<Product[]>("/products", []);
  const movementsQuery = useRemote<Movement[]>("/inventory/movements", []);
  const notificationsQuery = useRemote<Notification[]>("/notifications", []);
  const salesQuery = useRemote<Sale[]>("/sales", []);
  const returnsQuery = useRemote<ReturnRecord[]>("/returns", []);
  const [message, setMessage] = useState("");
  const [adjustment, setAdjustment] = useState({ productId: "", quantity: "", note: "" });
  const [returnForm, setReturnForm] = useState({ saleId: "", quantity: "1", reason: "" });
  const adjust = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api("/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify({ productId: Number(adjustment.productId), quantity: Number(adjustment.quantity), note: adjustment.note }),
      });
      await Promise.all([productsQuery.reload(), movementsQuery.reload(), notificationsQuery.reload()]);
      setMessage("Inventory adjustment saved");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Adjustment failed"); }
  };
  const createReturn = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api("/returns", {
        method: "POST",
        body: JSON.stringify({ saleId: Number(returnForm.saleId), quantity: Number(returnForm.quantity), reason: returnForm.reason }),
      });
      await Promise.all([returnsQuery.reload(), productsQuery.reload(), movementsQuery.reload()]);
      setMessage("Return completed and stock/payment updated");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Return failed"); }
  };
  const exportTraceability = async () => {
    try {
      const response = await fetch("/api/integrations/eptts/products.csv");
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Export failed");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `eptts-products-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Traceability CSV exported");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed");
    }
  };
  return (
    <div>
      <PageHeading title="Inventory Control" description="Live stock ledger, expiry alerts, adjustments and customer returns." action={<Button onClick={exportTraceability}><Download size={14} />Export traceability</Button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><ArchiveRestore size={17} />Stock adjustment</h3>
          <form onSubmit={adjust} className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Product" required value={adjustment.productId} onChange={(e) => setAdjustment({ ...adjustment, productId: e.target.value })} options={["", ...productsQuery.data.map((item) => String(item.id))]} optionLabels={Object.fromEntries([["", "Select product"], ...productsQuery.data.map((item) => [String(item.id), item.name])])} />
            <Field label="Quantity (+/-)" required type="number" value={adjustment.quantity} onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })} />
            <Field label="Reason / note" required value={adjustment.note} onChange={(e) => setAdjustment({ ...adjustment, note: e.target.value })} />
            <Button type="submit"><Save size={14} />Save adjustment</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><RotateCcw size={17} />Customer return</h3>
          <form onSubmit={createReturn} className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Sale" required value={returnForm.saleId} onChange={(e) => setReturnForm({ ...returnForm, saleId: e.target.value })} options={["", ...salesQuery.data.map((sale) => String(sale.id))]} optionLabels={Object.fromEntries([["", "Select sale"], ...salesQuery.data.map((sale) => [String(sale.id), `#${sale.id} — ${sale.product} — ${sale.customer}`])])} />
            <Field label="Quantity" required type="number" min="1" value={returnForm.quantity} onChange={(e) => setReturnForm({ ...returnForm, quantity: e.target.value })} />
            <Field label="Return reason" required value={returnForm.reason} onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })} />
            <Button type="submit"><RotateCcw size={14} />Complete return</Button>
          </form>
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[.7fr_1.3fr]">
        <Panel className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><BellRing size={17} />Active alerts</h3>
          <div className="space-y-2">
            {notificationsQuery.data.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-white/65 p-3">
                <div className="flex items-center justify-between gap-2"><b className="text-xs">{item.title}</b><StatusPill status={item.severity} /></div>
                <p className="mt-1 text-[10px] text-muted-foreground">{item.message}</p>
              </div>
            ))}
            {!notificationsQuery.data.length && <p className="text-xs text-muted-foreground">No active stock or expiry alerts.</p>}
          </div>
        </Panel>
        <Panel className="overflow-hidden">
          <div className="p-4"><h3 className="text-base font-semibold">Stock ledger</h3></div>
          <DataTable headers={["Product", "Movement", "Quantity", "Balance", "Reference", "Date"]}>
            {movementsQuery.data.slice(0, 100).map((movement) => (
              <tr key={movement.id}>
                <td className={td}><b>{movement.product}</b></td>
                <td className={td}>{movement.type}</td>
                <td className={td}><span className={movement.quantity >= 0 ? "text-emerald-700" : "text-rose-700"}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</span></td>
                <td className={td}>{movement.balanceAfter}</td>
                <td className={td}>{movement.reference}</td>
                <td className={td}>{new Date(movement.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>
      <Panel className="mt-4 overflow-hidden">
        <div className="p-4"><h3 className="text-base font-semibold">Completed returns</h3></div>
        {returnsQuery.data.length ? (
          <DataTable headers={["Product", "Customer", "Quantity", "Refund", "Reason", "Date"]}>
            {returnsQuery.data.map((item) => (
              <tr key={item.id}>
                <td className={td}>{item.product}</td><td className={td}>{item.customer}</td><td className={td}>{item.quantity}</td><td className={td}>{money(item.amount)}</td><td className={td}>{item.reason}</td><td className={td}>{new Date(item.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState label="No returns have been recorded." />}
      </Panel>
      {message && <Feedback message={message} />}
    </div>
  );
}

export function AdministrationPage() {
  const usersQuery = useRemote<TeamUser[]>("/users", []);
  const auditQuery = useRemote<AuditEvent[]>("/audit-log", []);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Pharmacist" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const addUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "Pharmacist" });
      await usersQuery.reload();
      setMessage("Team member created");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create user"); }
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api("/auth/change-password", { method: "POST", body: JSON.stringify(passwordForm) });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setMessage("Password changed");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Password change failed"); }
  };
  const downloadBackup = async () => {
    try {
      const response = await fetch("/api/backup/export");
      if (!response.ok) throw new Error("Backup export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pharmacy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Operational backup downloaded");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Backup failed"); }
  };
  const restoreBackup = async (file?: File) => {
    if (!file || !window.confirm("Restore this backup and replace current operational data?")) return;
    try {
      const backup = JSON.parse(await file.text());
      await api("/backup/restore", {
        method: "POST",
        body: JSON.stringify({ confirmation: "RESTORE", backup }),
      });
      setMessage("Backup restored. Refreshing workspace...");
      window.setTimeout(() => window.location.reload(), 800);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Restore failed"); }
  };
  const toggleUser = async (user: TeamUser) => {
    try {
      await api(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: user.status === "Active" ? "Inactive" : "Active" }),
      });
      await usersQuery.reload();
      setMessage(`Account ${user.status === "Active" ? "disabled" : "enabled"}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Account update failed"); }
  };
  const deleteUser = async (user: TeamUser) => {
    if (!window.confirm(`Delete ${user.name}''s account?`)) return;
    try {
      await api(`/users/${user.id}`, { method: "DELETE" });
      await usersQuery.reload();
      setMessage("Account deleted");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Account deletion failed"); }
  };
  return (
    <div>
      <PageHeading
        title="Administration & Security"
        description="Team permissions, password security, audit history and disaster recovery."
        action={<Button onClick={downloadBackup}><Download size={14} />Download backup</Button>}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><UserPlus size={17} />Add team member</h3>
          <form onSubmit={addUser} className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field label="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Field label="Temporary password" required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={["Manager", "Pharmacist", "Cashier", "Inventory", "Accountant"]} />
            <Button className="sm:col-span-2" type="submit"><Plus size={14} />Create account</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><ShieldCheck size={17} />Account security</h3>
          <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-2">
            <Field label="Current password" required type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            <Field label="New password" required minLength={8} type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            <Button className="sm:col-span-2" type="submit"><Save size={14} />Change password</Button>
          </form>
          <div className="mt-5 rounded-2xl border border-dashed border-border p-4">
            <p className="text-xs font-semibold">Restore backup</p>
            <p className="my-2 text-[10px] text-muted-foreground">Restoring replaces operational records after explicit confirmation.</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-[11px] font-medium">
              <Upload size={14} />Choose backup
              <input type="file" accept="application/json" className="sr-only" onChange={(e) => void restoreBackup(e.target.files?.[0])} />
            </label>
          </div>
        </Panel>
      </div>
      <Panel className="mt-4 overflow-hidden">
        <div className="p-4"><h3 className="text-base font-semibold">Team accounts</h3></div>
        <DataTable headers={["Name", "Email", "Role", "Status", "Created", "Actions"]}>
          {usersQuery.data.map((user) => (
            <tr key={user.id}><td className={td}><b>{user.name}</b></td><td className={td}>{user.email}</td><td className={td}>{user.role}</td><td className={td}><StatusPill status={user.status} /></td><td className={td}>{new Date(user.createdAt).toLocaleDateString()}</td><td className={`${td} whitespace-nowrap`}><Button variant="secondary" onClick={() => void toggleUser(user)}>{user.status === "Active" ? "Disable" : "Enable"}</Button><Button className="ml-2" variant="danger" onClick={() => void deleteUser(user)}>Delete</Button></td></tr>
          ))}
        </DataTable>
      </Panel>
      <Panel className="mt-4 overflow-hidden">
        <div className="p-4"><h3 className="text-base font-semibold">Audit trail</h3></div>
        {auditQuery.data.length ? (
          <DataTable headers={["Action", "Entity", "Record", "Actor", "Details", "Date"]}>
            {auditQuery.data.slice(0, 150).map((event) => (
              <tr key={event.id}><td className={td}><b>{event.action}</b></td><td className={td}>{event.entity}</td><td className={td}>{event.entityId ?? "—"}</td><td className={td}>{event.actor}</td><td className={td}>{event.details ?? "—"}</td><td className={td}>{new Date(event.createdAt).toLocaleString()}</td></tr>
            ))}
          </DataTable>
        ) : <EmptyState label="Operational actions will be recorded here." />}
      </Panel>
      {message && <Feedback message={message} />}
    </div>
  );
}
