import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell as RechartsCell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar as RechartsRadar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Archive,
  ArrowRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Filter,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PackageOpen,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import {
  getListCategoriesQueryKey,
  getListCustomersQueryKey,
  getListOrdersQueryKey,
  getListProductsQueryKey,
  getListSalesQueryKey,
  useCreateCategory,
  useCreateCustomer,
  useCreateOrder,
  useCreatePayment,
  useCreateProduct,
  useDeleteCategory,
  useDeleteCustomer,
  useDeleteOrder,
  useDeleteProduct,
  useDeleteSale,
  useGetDashboard,
  useGetSettings,
  useListCategories,
  useListCustomers,
  useListOrders,
  useListPayments,
  useListProducts,
  useListSales,
  useUpdateCategory,
  useUpdateCustomer,
  useUpdateOrder,
  useUpdateProduct,
  useUpdateSale,
  useUpdateSettings,
  type Category,
  type Customer,
  type Order,
  type Payment,
  type Product,
  type Sale,
} from "@workspace/api-client-react";
import {
  Button,
  EmptyState,
  Field,
  Feedback,
  LoadingRows,
  MetricCard,
  Modal,
  PageHeading,
  Panel,
  SearchBox,
  SelectField,
  StatusPill,
  Trend,
  dropdownItemClass,
  dropdownMenuClass,
} from "@/components/ui-kit";

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Amoxicillin 500mg",
    category: "Antibiotics",
    sku: "AMX-500-24",
    stock: 86,
    price: 12.5,
    expiry: "2026-03-18",
    status: "In stock",
    supplier: "NorthStar Pharma",
    description: "Capsules, 24 count",
  },
  {
    id: 2,
    name: "Loratadine 10mg",
    category: "Allergy care",
    sku: "LOR-010-30",
    stock: 28,
    price: 8.75,
    expiry: "2025-11-02",
    status: "Low stock",
    supplier: "Cura Wholesale",
    description: "Tablets, 30 count",
  },
  {
    id: 3,
    name: "Vitamin D3 1000 IU",
    category: "Vitamins",
    sku: "VTD-100-60",
    stock: 143,
    price: 16.2,
    expiry: "2027-01-21",
    status: "In stock",
    supplier: "WellSpring Labs",
    description: "Softgels, 60 count",
  },
  {
    id: 4,
    name: "Omeprazole 20mg",
    category: "Digestive health",
    sku: "OMP-020-28",
    stock: 0,
    price: 10.45,
    expiry: "2025-08-16",
    status: "Out of stock",
    supplier: "NorthStar Pharma",
    description: "Capsules, 28 count",
  },
  {
    id: 5,
    name: "Saline nasal spray",
    category: "Respiratory",
    sku: "SAL-100-01",
    stock: 52,
    price: 7.9,
    expiry: "2026-09-30",
    status: "In stock",
    supplier: "Cura Wholesale",
    description: "100 ml bottle",
  },
];
const fallbackCategories: Category[] = [
  {
    id: 1,
    name: "Antibiotics",
    productCount: 24,
    sales: 35420,
    color: "#36ae91",
  },
  { id: 2, name: "Vitamins", productCount: 31, sales: 28140, color: "#f0bf66" },
  {
    id: 3,
    name: "Allergy care",
    productCount: 18,
    sales: 19860,
    color: "#70a9c1",
  },
  {
    id: 4,
    name: "Digestive health",
    productCount: 15,
    sales: 14220,
    color: "#9e88bf",
  },
];
const fallbackOrders: Order[] = [
  {
    id: 1048,
    customer: "Maya Chen",
    product: "Amoxicillin 500mg",
    paymentMethod: "Card",
    quantity: 2,
    total: 25,
    status: "Completed",
    date: "2025-05-18",
  },
  {
    id: 1047,
    customer: "Jon Bell",
    product: "Vitamin D3 1000 IU",
    paymentMethod: "Insurance",
    quantity: 1,
    total: 16.2,
    status: "Processing",
    date: "2025-05-18",
  },
  {
    id: 1046,
    customer: "Priya Shah",
    product: "Loratadine 10mg",
    paymentMethod: "Cash",
    quantity: 3,
    total: 26.25,
    status: "Pending",
    date: "2025-05-17",
  },
  {
    id: 1045,
    customer: "Noah Williams",
    product: "Saline nasal spray",
    paymentMethod: "Card",
    quantity: 2,
    total: 15.8,
    status: "Completed",
    date: "2025-05-17",
  },
  {
    id: 1044,
    customer: "Ella Martin",
    product: "Omeprazole 20mg",
    paymentMethod: "Card",
    quantity: 1,
    total: 10.45,
    status: "Cancelled",
    date: "2025-05-16",
  },
];
const fallbackCustomers: Customer[] = [
  {
    id: 1,
    name: "Maya Chen",
    email: "maya.chen@email.com",
    phone: "(415) 555-0138",
    orders: 12,
    spent: 428.5,
    status: "Active",
  },
  {
    id: 2,
    name: "Jon Bell",
    email: "jon.bell@email.com",
    phone: "(415) 555-0182",
    orders: 8,
    spent: 246.2,
    status: "Active",
  },
  {
    id: 3,
    name: "Priya Shah",
    email: "priya.shah@email.com",
    phone: "(415) 555-0199",
    orders: 5,
    spent: 118.75,
    status: "Active",
  },
  {
    id: 4,
    name: "Noah Williams",
    email: "noah.williams@email.com",
    phone: "(415) 555-0151",
    orders: 3,
    spent: 74.9,
    status: "Inactive",
  },
];
const fallbackPayments: Payment[] = [
  {
    id: 1,
    customer: "Maya Chen",
    amount: 25,
    method: "Card",
    status: "Paid",
    date: "2025-05-18",
    reference: "PAY-8G42K",
  },
  {
    id: 2,
    customer: "Jon Bell",
    amount: 16.2,
    method: "Insurance",
    status: "Pending",
    date: "2025-05-18",
    reference: "PAY-8G41P",
  },
  {
    id: 3,
    customer: "Priya Shah",
    amount: 26.25,
    method: "Cash",
    status: "Paid",
    date: "2025-05-17",
    reference: "PAY-8G3XM",
  },
  {
    id: 4,
    customer: "Noah Williams",
    amount: 15.8,
    method: "Card",
    status: "Paid",
    date: "2025-05-17",
    reference: "PAY-8G3QA",
  },
];
const fallbackDashboard = {
  sales: 12648.4,
  categories: 4,
  expired: 7,
  users: 284,
  totalSales: 86420.35,
  weeklySales: [
    { label: "Mon", value: 820 },
    { label: "Tue", value: 1160 },
    { label: "Wed", value: 980 },
    { label: "Thu", value: 1450 },
    { label: "Fri", value: 1320 },
    { label: "Sat", value: 1640 },
    { label: "Sun", value: 1280 },
  ],
};
const money = (value = 0) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";

function withinPeriod(value: string, period: string) {
  if (period === "All" || period === "All time" || period === "Yearly") return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const elapsedDays = (now.getTime() - date.getTime()) / 86_400_000;
  if (period === "Last 7 days" || period === "This Week") return elapsedDays >= 0 && elapsedDays <= 7;
  if (period === "Last 30 days") return elapsedDays >= 0 && elapsedDays <= 30;
  if (period === "This Month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (period === "This quarter") return date.getFullYear() === now.getFullYear() && Math.floor(date.getMonth() / 3) === Math.floor(now.getMonth() / 3);
  if (period === "This Year") return date.getFullYear() === now.getFullYear();
  return true;
}

function groupedTotals<T>(rows: T[], label: (row: T) => string, value: (row: T) => number) {
  const groups = new Map<string, number>();
  rows.forEach((row) => groups.set(label(row), (groups.get(label(row)) ?? 0) + value(row)));
  return [...groups.entries()].map(([name, total]) => ({ name, total }));
}

function downloadCsv(fileName: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function useFeedback() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2400);
    return () => window.clearTimeout(timer);
  }, [message]);
  return { message, show: setMessage };
}

function TableShell({
  children,
  headers,
}: {
  children: ReactNode;
  headers: string[];
}) {
  return (
    <div className="max-w-full overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-border/70">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-[10px] font-medium text-[#153f42]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Row({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border/65 transition-colors last:border-0 hover:bg-white/45">
      {children}
    </tr>
  );
}
function Cell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3.5 text-[10px] text-foreground ${className}`}>
      {children}
    </td>
  );
}
function Initials({ name }: { name: string }) {
  return (
    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f2c79d] to-[#78cfc7] text-[8px] font-bold text-[#164b4d] ring-2 ring-white/70">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

function PanelHeader({ title, action }: { title: string; action?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mb-4 flex items-center justify-between">
      <h3 className="text-[16px] font-medium tracking-[-.025em]">{title}</h3>
      {action ?? (
        <button onClick={() => setOpen(!open)} className="action-icon" aria-label={`More ${title} options`}>
          <MoreHorizontal size={16} />
        </button>
      )}
      {!action && open && (
        <div className={`${dropdownMenuClass} right-0 top-7 w-44`} role="menu">
          <button onClick={() => setOpen(false)} className={dropdownItemClass}>View panel details</button>
          <button onClick={() => setOpen(false)} className={dropdownItemClass}>Close options</button>
        </div>
      )}
    </div>
  );
}

function PeriodButton({
  label = "This Month",
  options = ["This Week", "This Month", "This Year", "All time"],
  onChange,
}: {
  label?: string;
  options?: string[];
  onChange?: (period: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState(label);
  useEffect(() => setPeriod(label), [label]);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-white/55 px-3 text-[10px] text-[#31575a] hover:bg-white"
      >
        <CalendarDays size={12} />
        {period}
        <ChevronDownIcon />
      </button>
      {open && (
        <div className={`${dropdownMenuClass} right-0 top-9 w-44`} role="menu">
          {options.map((item) => (
            <button
              key={item}
              onClick={() => { setPeriod(item); onChange?.(item); setOpen(false); }}
              className={`${dropdownItemClass} ${period === item ? "bg-[#dff4f1] font-semibold text-[#073f42]" : ""}`}
            >
              <span>{item}</span>
              {period === item && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return <span className="text-[9px]">⌄</span>;
}

function PaginationBar({
  total = 0,
  onPageChange,
  onPageSizeChange,
}: {
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const changePage = (next: number) => {
    const value = Math.min(maxPage, Math.max(1, next));
    setPage(value);
    onPageChange?.(value);
  };
  const changePageSize = (next: number) => {
    setPageSize(next);
    setPage(1);
    onPageSizeChange?.(next);
    onPageChange?.(1);
  };
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => changePage(page - 1)}
          disabled={page === 1}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-white/45 px-3 text-[10px]"
        >
          <ChevronLeft size={12} />
          Prev
        </button>
        {Array.from({ length: Math.min(maxPage, 3) }, (_, index) => index + 1).map((item) => (
          <button
            key={item}
            onClick={() => changePage(item)}
            className={`grid size-8 place-items-center rounded-full border text-[10px] ${page === item ? "border-[#003f42] bg-[#003f42] text-white" : "border-border bg-white/45"}`}
          >
            {item}
          </button>
        ))}
        {maxPage > 3 && <span className="grid size-8 place-items-center text-[10px]">…</span>}
        {maxPage > 3 && <button onClick={() => changePage(maxPage)} className={`grid size-8 place-items-center rounded-full border text-[10px] ${page === maxPage ? "border-[#003f42] bg-[#003f42] text-white" : "border-border bg-white/45"}`}>{maxPage}</button>}
        <button
          onClick={() => changePage(page + 1)}
          disabled={page === maxPage}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-white/45 px-3 text-[10px]"
        >
          Next
          <ChevronRight size={12} />
        </button>
      </div>
      <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
        <span>Showing {total ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} of {total} entries</span>
        <div className="w-24">
          <SelectField
            label=""
            aria-label="Rows per page"
            value={`Show ${pageSize}`}
            onChange={(event) => changePageSize(Number(event.target.value.replace("Show ", "")))}
            options={["Show 3", "Show 5", "Show 10"]}
          />
        </div>
      </div>
    </div>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [quantity, setQuantity] = useState(value);
  useEffect(() => setQuantity(value), [value]);
  const change = (next: number) => {
    const safe = Math.max(1, next);
    setQuantity(safe);
    onChange(safe);
  };
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => change(quantity - 1)}
        className="grid size-4 place-items-center rounded-full bg-[#dcebea] transition hover:bg-[#c6dddb]"
      >
        −
      </button>
      <span className="min-w-3 text-center">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => change(quantity + 1)}
        className="grid size-4 place-items-center rounded-full bg-[#003f42] text-white transition hover:bg-[#07565a]"
      >
        +
      </button>
    </span>
  );
}

function DonutVisual({ center = "$0", values = [], labels = [] }: { center?: string; values?: number[]; labels?: string[] }) {
  const colors = ["#82d4ca", "#f3aeb7", "#cce995", "#a6afe7", "#efc184"];
  const data = values.map((value, index) => ({ name: labels[index] ?? `Item ${index + 1}`, value }));
  const hasData = data.some((item) => item.value > 0);
  const shown = hasData ? data : [{ name: "No data", value: 1 }];
  return (
    <div className="relative mx-auto size-44" role="img" aria-label="Interactive revenue chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={shown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="transparent">
            {shown.map((_, index) => <RechartsCell key={index} fill={hasData ? colors[index % colors.length] : "#dce9e7"} />)}
          </Pie>
          {hasData && <RechartsTooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 14, borderColor: "#d6e7e5", fontSize: 11 }} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-[42px] grid place-items-center rounded-full">
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground">Revenue</p>
          <p className="text-xl font-semibold">{center}</p>
        </div>
      </div>
    </div>
  );
}

function BarsVisual({ values = [], labels = [] }: { values?: number[]; labels?: string[] }) {
  const displayValues = values.length ? values : Array(6).fill(0);
  const colors = [
    "#efc184",
    "#df8cd4",
    "#c8e58b",
    "#72cdc1",
    "#e99ea6",
    "#9ca7e9",
    "#9ed8e7",
  ];
  const data = displayValues.map((value, index) => ({ label: labels[index] ?? ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][index] ?? String(index + 1), value }));
  return (
    <div className="soft-grid h-[190px] rounded-xl pt-3" role="img" aria-label="Interactive sales bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dce9e7" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#668083" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#668083" }} />
          <RechartsTooltip formatter={(value) => money(Number(value))} cursor={{ fill: "rgba(255,255,255,.45)" }} contentStyle={{ borderRadius: 14, borderColor: "#d6e7e5", fontSize: 11 }} />
          <Bar dataKey="value" radius={[18, 18, 6, 6]} maxBarSize={44} animationDuration={450}>
            {data.map((_, index) => <RechartsCell key={index} fill={colors[index % colors.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineVisual({
  pink = false,
  compact = false,
  values = [],
  labels = [],
}: {
  pink?: boolean;
  compact?: boolean;
  values?: number[];
  labels?: string[];
}) {
  const stroke = pink ? "#ef9faa" : "#32b8aa";
  const data = values.map((value, index) => ({ label: labels[index] ?? String(index + 1), value }));
  return (
    <div
      className={`soft-grid relative overflow-hidden rounded-xl ${compact ? "h-[76px]" : "h-[150px]"}`}
      role="img"
      aria-label="Interactive trend line chart"
    >
      {data.length ? <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 3 }}>
          {!compact && <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dce9e7" />}
          <YAxis hide domain={["auto", "auto"]} />
          <RechartsTooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 14, borderColor: "#d6e7e5", fontSize: 11 }} />
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2.5} dot={{ r: 3, fill: stroke, stroke: "white", strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={450} />
        </LineChart>
      </ResponsiveContainer> : <div className="grid h-full place-items-center text-[10px] text-muted-foreground">No data for this period</div>}
    </div>
  );
}

function RadarVisual({ values = [], labels = [] }: { values?: number[]; labels?: string[] }) {
  const data = values.map((value, index) => ({ label: labels[index] ?? String(index + 1), value }));
  return (
    <div className="relative mx-auto h-[190px] max-w-[280px]" role="img" aria-label="Interactive product distribution chart">
      {data.length >= 3 ? <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#bddbd8" />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: 9, fill: "#668083" }} />
          <RechartsTooltip contentStyle={{ borderRadius: 14, borderColor: "#d6e7e5", fontSize: 11 }} />
          <RechartsRadar dataKey="value" stroke="#22b7a8" fill="#72cdc1" fillOpacity={0.3} dot animationDuration={450} />
        </RadarChart>
      </ResponsiveContainer> : <div className="grid h-full place-items-center text-[10px] text-muted-foreground">No data for this period</div>}
    </div>
  );
}

function OrdersLineVisual({ current = [], previous = [], labels = [] }: { current?: number[]; previous?: number[]; labels?: string[] }) {
  const length = Math.max(current.length, previous.length, labels.length);
  const data = Array.from({ length }, (_, index) => ({ label: labels[index] ?? String(index + 1), current: current[index] ?? 0, previous: previous[index] ?? 0 }));
  return (
    <div className="soft-grid relative h-[190px] overflow-hidden rounded-xl" role="img" aria-label="Interactive orders comparison chart">
      {data.length ? <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: -22, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#dce9e7" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#668083" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#668083" }} />
          <RechartsTooltip contentStyle={{ borderRadius: 14, borderColor: "#d6e7e5", fontSize: 11 }} />
          <Line type="monotone" dataKey="current" name="Current" stroke="#2db5a7" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="previous" name="Previous" stroke="#eea4ae" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer> : <div className="grid h-full place-items-center text-[10px] text-muted-foreground">No data for this period</div>}
    </div>
  );
}

export function DashboardPage() {
  const dashboardQuery = useGetDashboard();
  const ordersQuery = useListOrders();
  const salesQuery = useListSales();
  const dashboard = dashboardQuery.data ?? { sales: 0, categories: 0, expired: 0, users: 0, totalSales: 0, weeklySales: [] };
  const orders = ordersQuery.data ?? [];
  const sales = salesQuery.data ?? [];
  const [, setLocation] = useLocation();
  const [tableSearch, setTableSearch] = useState("");
  const [dashboardPeriod, setDashboardPeriod] = useState("All time");
  const [salesStatus, setSalesStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { message, show } = useFeedback();
  const updateDashboardOrder = useUpdateOrder();
  const periodOrders = orders.filter((order) => withinPeriod(order.date, dashboardPeriod));
  const periodSales = sales.filter((sale) => withinPeriod(sale.date, dashboardPeriod));
  const chartSales = groupedTotals(periodSales, (sale) => shortDate(sale.date), (sale) => sale.total).slice(-7);
  const orderGroups = groupedTotals(periodOrders, (order) => order.status, (order) => order.total);
  const periodRevenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
  const dashboardRows = periodOrders
    .filter((order) =>
      `${order.customer} ${order.product}`.toLowerCase().includes(tableSearch.toLowerCase()) &&
      (salesStatus === "All" || order.status === salesStatus),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div>
      <PageHeading
        title="Welcome Code Astro!"
        action={
          <Button variant="secondary" onClick={() => setLocation("/profile")}>
            Team Member <ChevronDownIcon />
          </Button>
        }
      />
      <Panel className="p-4">
        <PanelHeader title="Pharmacy Sales Results" action={<PeriodButton label={dashboardPeriod} onChange={setDashboardPeriod} />} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Todays Sales"
            value={money(periodRevenue)}
            change={dashboardPeriod}
            tone="mint"
            icon={ShoppingCart}
          />
          <MetricCard
            label="Available Categories"
            value={dashboard.categories.toLocaleString()}
            change="From saved records"
            tone="blue"
            icon={Boxes}
          />
          <MetricCard
            label="Expired Medicines"
            value={dashboard.expired.toLocaleString()}
            change="From saved records"
            tone="rose"
            icon={PackageOpen}
          />
          <MetricCard
            label="System Users"
            value={dashboard.users.toLocaleString()}
            change="From saved records"
            tone="lilac"
            icon={Users}
          />
        </div>
      </Panel>
      <div className="mt-4 grid gap-4 xl:grid-cols-[.72fr_1.28fr]">
        <Panel className="p-4">
          <PanelHeader title="Graph Report" />
          <div className="pt-2">
            <DonutVisual center={money(periodOrders.reduce((sum, order) => sum + order.total, 0))} values={orderGroups.map((item) => item.total)} labels={orderGroups.map((item) => item.name)} />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-[9px] text-muted-foreground">
            {orderGroups.map((item, index) => (
              <span key={item.name} className="flex items-center gap-1">
                <i className="size-2 rounded-full" style={{ backgroundColor: ["#82d4ca", "#f3aeb7", "#cce995", "#a6afe7"][index % 4] }} />
                {item.name}
              </span>
            ))}
          </div>
        </Panel>
        <Panel className="p-4">
          <PanelHeader title="Total Sales Overview" />
          <BarsVisual values={chartSales.map((item) => item.total)} labels={chartSales.map((item) => item.name)} />
        </Panel>
      </div>
      <Panel className="mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 px-4 pb-3 pt-4 xl:flex-row xl:items-center xl:justify-between">
          <h3 className="text-[16px] font-medium">Recent Sales List</h3>
          <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:flex-nowrap">
            <SearchBox
              value={tableSearch}
              onChange={setTableSearch}
              placeholder="Search..."
            />
            <div className="w-28 shrink-0">
              <SelectField
                label=""
                aria-label="Filter recent sales"
                value={salesStatus}
                onChange={(event) => { setSalesStatus(event.target.value); setPage(1); }}
                options={["All", "Completed", "Pending", "Processing", "Cancelled"]}
              />
            </div>
            <Button variant="secondary" onClick={() => { downloadCsv("recent-sales.csv", [["Customer", "Product", "Quantity", "Total", "Date"], ...dashboardRows.map((row) => [row.customer, row.product, row.quantity, row.total, row.date])]); show("Sales exported"); }} aria-label="Export recent sales">
              <Download size={14} />
              Export
            </Button>
          </div>
        </div>
        <TableShell
          headers={[
            "Name",
            "Medicine",
            "Payment Method",
            "Quantity",
            "Total Price",
            "Date",
            "",
          ]}
        >
          {dashboardRows
            .slice((page - 1) * pageSize, page * pageSize)
            .map((order) => (
              <Row key={order.id}>
                <Cell>
                  <div className="flex items-center gap-2">
                    <Initials name={order.customer} />
                    {order.customer}
                  </div>
                </Cell>
                <Cell>{order.product}</Cell>
                <Cell className="text-muted-foreground">{order.paymentMethod}</Cell>
                <Cell>
                  <QuantityStepper value={order.quantity} onChange={(quantity) => updateDashboardOrder.mutate({ id: order.id, data: { quantity, total: (order.total / Math.max(order.quantity, 1)) * quantity } }, { onError: () => show("Quantity update failed") })} />
                </Cell>
                <Cell>{money(order.total)}</Cell>
                <Cell>{shortDate(order.date)}</Cell>
                <Cell>
                  <div className="flex">
                    <button
                      className="action-icon"
                      onClick={() => setLocation("/orders")}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="action-icon"
                      onClick={() => setLocation("/orders")}
                    >
                      <Trash2 size={12} />
                    </button>
                    <button className="action-icon" onClick={() => show(`Order #${order.id}: ${order.status}`)} aria-label={`View order ${order.id} details`}>
                      <MoreHorizontal size={12} />
                    </button>
                  </div>
                </Cell>
              </Row>
            ))}
        </TableShell>
        <PaginationBar total={dashboardRows.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </Panel>
      {message && <Feedback message={message} />}
    </div>
  );
}

function DashboardPageLegacy() {
  const dashboardQuery = useGetDashboard();
  const ordersQuery = useListOrders();
  const productsQuery = useListProducts();
  const categoriesQuery = useListCategories();
  const dashboard = dashboardQuery.data ?? fallbackDashboard;
  const orders = ordersQuery.data ?? fallbackOrders;
  const products = productsQuery.data ?? fallbackProducts;
  const categories = categoriesQuery.data ?? fallbackCategories;
  const [, setLocation] = useLocation();
  const { message, show } = useFeedback();
  const max = Math.max(...dashboard.weeklySales.map((item) => item.value), 1);
  return (
    <div>
      <PageHeading
        eyebrow="Tuesday, September 8, 2026"
        title="Good morning, Budiono."
        description="Here’s the pulse of your pharmacy today."
        action={
          <Button
            onClick={() => setLocation("/orders")}
            data-testid="button-new-sale"
          >
            <Plus size={16} />
            New sale
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today’s sales"
          value={money(dashboard.sales)}
          change="+8.4% from yesterday"
          tone="mint"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Orders this week"
          value={`${dashboard.totalSales.toLocaleString()}`}
          change="+12.1% this week"
          tone="yellow"
          icon={ShoppingCart}
        />
        <MetricCard
          label="Active categories"
          value={String(dashboard.categories)}
          change="2 added this month"
          tone="blue"
          icon={Boxes}
        />
        <MetricCard
          label="Expiring soon"
          value={String(dashboard.expired)}
          change="Needs attention"
          tone="rose"
          icon={Clock3}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold">Weekly sales</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Revenue collected across all channels
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => show("Dashboard export prepared")}
              data-testid="button-export-dashboard"
            >
              <Download size={14} />
              Export
            </Button>
          </div>
          <div className="flex h-[220px] items-end gap-2 sm:gap-5">
            {dashboard.weeklySales.map((item, index) => (
              <div
                key={item.label}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <div className="relative flex h-[180px] w-full items-end justify-center">
                  <div
                    className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 group-hover:brightness-95 ${index === dashboard.weeklySales.length - 2 ? "bg-primary" : "bg-[#bce8dd]"}`}
                    style={{
                      height: `${Math.max(12, (item.value / max) * 100)}%`,
                    }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {money(item.value)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold">Category mix</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Sales by category
              </p>
            </div>
            <Link
              href="/categories"
              data-testid="link-view-categories"
              className="text-xs font-semibold text-primary"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {categories.slice(0, 4).map((category) => (
              <div key={category.id}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium">{category.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {money(category.sales)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, category.sales / 420)}%`,
                      backgroundColor: category.color || "#36ae91",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-[#f7faf7] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#277263]">
              <Activity size={14} />
              Stock health is stable
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {products.filter((p) => p.status === "Low stock").length} products
              need restocking this week.
            </p>
          </div>
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Panel>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="font-mono text-sm font-bold">Recent orders</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest activity from the counter and online store
              </p>
            </div>
            <Link
              href="/orders"
              data-testid="link-view-orders"
              className="text-xs font-semibold text-primary"
            >
              View orders <ArrowRight className="ml-1 inline" size={13} />
            </Link>
          </div>
          <TableShell
            headers={["Order", "Customer", "Amount", "Status", "Date"]}
          >
            {orders.slice(0, 4).map((order) => (
              <Row key={order.id}>
                <Cell>
                  <span className="font-mono font-bold">#{order.id}</span>
                </Cell>
                <Cell>
                  <div className="flex items-center gap-2">
                    <Initials name={order.customer} />
                    <span className="font-medium">{order.customer}</span>
                  </div>
                </Cell>
                <Cell className="font-mono font-semibold">
                  {money(order.total)}
                </Cell>
                <Cell>
                  <StatusPill status={order.status} />
                </Cell>
                <Cell className="text-muted-foreground">
                  {shortDate(order.date)}
                </Cell>
              </Row>
            ))}
          </TableShell>
        </Panel>
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold">Quick actions</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Common tasks, one click away
              </p>
            </div>
            <Archive size={18} className="text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/products", label: "Add product", icon: PackageOpen },
              {
                href: "/orders",
                label: "Create order",
                icon: ClipboardListIcon,
              },
              { href: "/customers", label: "New customer", icon: Users },
              { href: "/reports", label: "View reports", icon: BarChart3 },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                data-testid={`link-quick-${label.toLowerCase().replaceAll(" ", "-")}`}
                className="group rounded-xl border border-border bg-background p-3 transition hover:border-primary/40 hover:bg-secondary/40"
              >
                <div className="mb-4 grid size-8 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon size={16} />
                </div>
                <span className="text-xs font-semibold">{label}</span>
                <ArrowRight
                  className="mt-2 text-muted-foreground transition group-hover:translate-x-1"
                  size={14}
                />
              </Link>
            ))}
          </div>
        </Panel>
      </div>
      {message && <Feedback message={message} />}
    </div>
  );
}
function ClipboardListIcon({ size }: { size?: number }) {
  return <FileText size={size} />;
}

type ProductForm = {
  name: string;
  category: string;
  sku: string;
  stock: string;
  price: string;
  expiry: string;
  status: string;
  supplier: string;
  description: string;
  cost: string;
  barcode: string;
  batchNumber: string;
  reorderLevel: string;
  unit: string;
};
const blankProduct: ProductForm = {
  name: "",
  category: "Antibiotics",
  sku: "",
  stock: "0",
  price: "",
  expiry: "",
  status: "In stock",
  supplier: "",
  description: "",
  cost: "",
  barcode: "",
  batchNumber: "",
  reorderLevel: "10",
  unit: "Pack",
};

export function ProductsPage() {
  const query = useListProducts();
  const categoriesQuery = useListCategories();
  const [location] = useLocation();
  const [rows, setRows] = useState<Product[]>([]);
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("search") ?? "",
  );
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [form, setForm] = useState<ProductForm>(blankProduct);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const { message, show } = useFeedback();
  const client = useQueryClient();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  useEffect(() => {
    if (query.data) setRows(query.data);
  }, [query.data]);
  useEffect(() => {
    const value = new URLSearchParams(location.split("?")[1] ?? "").get("search");
    if (value !== null) {
      setSearch(value);
      setPage(1);
    }
  }, [location]);
  useEffect(() => {
    const handleGlobalSearch = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      setSearch(value);
      setPage(1);
    };
    window.addEventListener("pharmacy-search", handleGlobalSearch);
    return () => window.removeEventListener("pharmacy-search", handleGlobalSearch);
  }, []);
  const categories = categoriesQuery.data ?? [];
  const filtered = rows.filter(
    (p) =>
      `${p.name} ${p.sku} ${p.category} ${p.barcode ?? ""} ${p.batchNumber ?? ""} ${p.supplier ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "All" || p.status === filter),
  );
  const productGroups = groupedTotals(filtered, (product) => product.category, () => 1).slice(0, 6);
  const productTrend = filtered.slice(0, 8);
  const openNew = () => {
    setEditing(null);
    setForm({ ...blankProduct, category: categories[0]?.name ?? "General" });
    setOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category,
      sku: product.sku,
      stock: String(product.stock),
      price: String(product.price),
      expiry: product.expiry.slice(0, 10),
      status: product.status,
      supplier: product.supplier ?? "",
      description: product.description ?? "",
      cost: String(product.cost ?? ""),
      barcode: product.barcode ?? "",
      batchNumber: product.batchNumber ?? "",
      reorderLevel: String(product.reorderLevel ?? 10),
      unit: product.unit ?? "Pack",
    });
    setOpen(true);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      stock: Number(form.stock),
      price: Number(form.price),
      cost: Number(form.cost || 0),
      reorderLevel: Number(form.reorderLevel || 0),
    };
    if (editing)
      update.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getListProductsQueryKey() });
            show("Product updated");
            setEditing(null);
            setOpen(false);
          },
          onError: () => show("Product update failed. Please try again."),
        },
      );
    else
      create.mutate(
        { data: payload },
        {
          onSuccess: (created) => {
            setRows([created, ...rows]);
            show("Product added");
            setEditing(null);
            setOpen(false);
          },
          onError: () => show("Product could not be saved. Please try again."),
        },
      );
  };
  const deleteRow = (product: Product) => {
    if (!window.confirm(`Remove ${product.name}?`)) return;
    remove.mutate(
      { id: product.id },
      {
        onSuccess: () => {
          setRows(rows.filter((row) => row.id !== product.id));
          client.invalidateQueries({ queryKey: getListProductsQueryKey() });
          show("Product removed");
        },
        onError: () => show("Product could not be removed. Please try again."),
      },
    );
  };
  return (
    <div>
      <PageHeading
        eyebrow="Inventory / Catalog"
        title="Products Inventory"
        description="Keep every item, batch, and expiry date in view."
        action={
          <Button onClick={openNew} data-testid="button-add-product">
            <Plus size={16} />
            Add product
          </Button>
        }
      />
      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Panel className="p-4">
          <PanelHeader title="Product Distribution" />
          <RadarVisual values={productGroups.map((item) => item.total)} labels={productGroups.map((item) => item.name)} />
        </Panel>
        <Panel className="p-4">
          <PanelHeader title="Top-Selling Products" />
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {["#e6b99d", "#aac8d6", "#f2c5bb", "#b7ddd6"].map(
              (color, index) => (
                <button
                  key={color}
                  onClick={() => setSearch(rows[index]?.name ?? "")}
                  className="grid h-14 place-items-center rounded-lg transition hover:-translate-y-1"
                  style={{ backgroundColor: color }}
                >
                  <PillIcon />
                </button>
              ),
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Out of Stock Products</p>
            <button className="action-icon" onClick={() => { setFilter("Out of stock"); setPage(1); }} aria-label="Show out of stock products">
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="mt-2 space-y-1.5">
            {rows.filter((product) => product.stock === 0 || product.status === "Out of stock").slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-[72px_1fr_auto] text-[9px]"
              >
                <span className="font-semibold">{product.sku}</span>
                <span>{product.name}</span>
                <span>Out</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-4">
          <PanelHeader title="Total Product Sales" />
          <LineVisual values={productTrend.map((product) => product.price * product.stock)} labels={productTrend.map((product) => product.name)} />
        </Panel>
      </div>
      <Panel className="overflow-hidden">
        <div className="px-4 pt-4">
          <h3 className="text-[17px] font-medium">Products List</h3>
        </div>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search products or SKU..."
          />
          <div className="flex gap-2">
            <SelectField
              label=""
              aria-label="Filter products"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={["All", "In stock", "Low stock", "Out of stock"]}
            />
          </div>
        </div>
        {query.isLoading ? (
          <LoadingRows />
        ) : filtered.length ? (
          <TableShell
            headers={[
              "Product",
              "SKU",
              "Category",
              "Stock",
              "Price",
              "Expiry",
              "Status",
              "",
            ]}
          >
            {filtered.slice((page - 1) * pageSize, page * pageSize).map((product) => (
              <Row key={product.id}>
                <Cell>
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-[#e7f6f0] text-primary">
                      <PillIcon />
                    </div>
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {product.supplier || "Supplier not set"}
                      </p>
                    </div>
                  </div>
                </Cell>
                <Cell className="font-mono text-muted-foreground">
                  {product.sku}
                </Cell>
                <Cell>{product.category}</Cell>
                <Cell className="font-mono font-bold">{product.stock}</Cell>
                <Cell className="font-mono">{money(product.price)}</Cell>
                <Cell
                  className={
                    new Date(product.expiry) < new Date("2025-09-01")
                      ? "font-semibold text-[#bd4b43]"
                      : "text-muted-foreground"
                  }
                >
                  {shortDate(product.expiry)}
                </Cell>
                <Cell>
                  <StatusPill status={product.status} />
                </Cell>
                <Cell>
                  <div className="flex justify-end gap-1">
                    <button
                      data-testid={`button-edit-product-${product.id}`}
                      onClick={() => openEdit(product)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      data-testid={`button-delete-product-${product.id}`}
                      onClick={() => deleteRow(product)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-[#bd4b43]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Cell>
              </Row>
            ))}
          </TableShell>
        ) : (
          <EmptyState
            label="Try a different search or add your first product."
            action={
              <Button onClick={openNew}>
                <Plus size={14} />
                Add product
              </Button>
            }
          />
        )}
      </Panel>
      <PaginationBar total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      <Modal
        open={open}
        title={editing ? "Edit product" : "Add product"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Product name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Field
              label="SKU"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
            <SelectField
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={categories.map((c) => c.name)}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={["In stock", "Low stock", "Out of stock"]}
            />
            <Field
              label="Stock units"
              type="number"
              required
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <Field
              label="Unit price"
              type="number"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Field
              label="Expiry date"
              type="date"
              required
              value={form.expiry}
              onChange={(e) => setForm({ ...form, expiry: e.target.value })}
            />
            <Field
              label="Supplier"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
            <Field
              label="Purchase cost"
              type="number"
              step="0.01"
              min="0"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
            <Field
              label="Barcode / GTIN"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
            <Field
              label="Batch / lot number"
              value={form.batchNumber}
              onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
            />
            <Field
              label="Reorder level"
              type="number"
              min="0"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
            />
            <SelectField
              label="Selling unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              options={["Pack", "Box", "Strip", "Tablet", "Bottle", "Tube", "Vial", "Unit"]}
            />
          </div>
          <Field
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-product">
              <Save size={14} />
              Save product
            </Button>
          </div>
        </form>
      </Modal>
      {message && <Feedback message={message} />}
    </div>
  );
}
function PillIcon() {
  return <span className="text-xs font-bold">Rx</span>;
}

function ProductModalBridge() {
  return null;
}

export function CategoriesPage() {
  const query = useListCategories();
  const [rows, setRows] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#36ae91");
  const { message, show } = useFeedback();
  const client = useQueryClient();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  useEffect(() => {
    if (query.data) setRows(query.data);
  }, [query.data]);
  const start = (row?: Category) => {
    setEditing(row ?? null);
    setName(row?.name ?? "");
    setColor(row?.color ?? "#36ae91");
    setOpen(true);
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    const data = { name, color };
    if (editing)
      update.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
            show("Category updated");
            setOpen(false);
          },
          onError: () => show("Category update failed. Please try again."),
        },
      );
    else
      create.mutate(
        { data },
        {
          onSuccess: (created) => {
            setRows([created, ...rows]);
            show("Category created");
            setOpen(false);
          },
          onError: () => show("Category could not be saved. Please try again."),
        },
      );
  };
  const destroy = (row: Category) => {
    if (!window.confirm(`Remove ${row.name}?`)) return;
    remove.mutate(
      { id: row.id },
      {
        onSuccess: () => {
          setRows(rows.filter((item) => item.id !== row.id));
          client.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          show("Category removed");
        },
        onError: () => show("Category could not be removed. Please try again."),
      },
    );
  };
  return (
    <div>
      <PageHeading
        eyebrow="Inventory / Taxonomy"
        title="Categories"
        description="Organize your catalog and understand which shelves carry the business."
        action={
          <Button onClick={() => start()} data-testid="button-add-category">
            <Plus size={16} />
            Add category
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold">
                Category distribution
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Share of catalog by product count
              </p>
            </div>
            <BarChart3 size={18} className="text-primary" />
          </div>
          <div
            className="mx-auto mb-6 grid size-44 place-items-center rounded-full"
            style={{
              background: `conic-gradient(${rows.map((row, index) => `${row.color || "#36ae91"} ${index * 25}% ${(index + 1) * 25}%`).join(", ")})`,
            }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-card">
              <span className="font-mono text-2xl font-bold">
                {rows.reduce((sum, row) => sum + row.productCount, 0)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                products
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.name}
                </span>
                <span className="font-mono font-bold">{row.productCount}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-mono text-sm font-bold">All categories</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Performance at a glance
            </p>
          </div>
          {query.isLoading ? (
            <LoadingRows />
          ) : (
            <TableShell
              headers={["Category", "Products", "Sales", "Share", ""]}
            >
              {rows.map((row) => (
                <Row key={row.id}>
                  <Cell>
                    <span className="flex items-center gap-2 font-semibold">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.name}
                    </span>
                  </Cell>
                  <Cell className="font-mono">{row.productCount}</Cell>
                  <Cell className="font-mono font-semibold">
                    {money(row.sales)}
                  </Cell>
                  <Cell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, row.sales / 400)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {Math.round(
                          (row.sales /
                            Math.max(
                              rows.reduce((sum, item) => sum + item.sales, 0),
                              1,
                            )) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                  </Cell>
                  <Cell>
                    <div className="flex justify-end gap-1">
                      <button
                        data-testid={`button-edit-category-${row.id}`}
                        onClick={() => start(row)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        data-testid={`button-delete-category-${row.id}`}
                        onClick={() => destroy(row)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-[#bd4b43]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Cell>
                </Row>
              ))}
            </TableShell>
          )}
        </Panel>
      </div>
      <Modal
        open={open}
        title={editing ? "Edit category" : "Add category"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          <Field
            label="Category name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Accent color
            </span>
            <input
              data-testid="input-category-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="block h-10 w-full rounded-xl border border-border bg-background p-1"
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-category">
              <Save size={14} />
              Save category
            </Button>
          </div>
        </form>
      </Modal>
      {message && <Feedback message={message} />}
    </div>
  );
}

export function OrdersPage() {
  const query = useListOrders();
  const [rows, setRows] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [chartPeriod, setChartPeriod] = useState("All time");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState({
    customer: "",
    product: "",
    paymentMethod: "Card",
    quantity: "1",
    total: "",
    status: "Pending",
  });
  const { message, show } = useFeedback();
  const client = useQueryClient();
  const create = useCreateOrder();
  const update = useUpdateOrder();
  const remove = useDeleteOrder();
  useEffect(() => {
    if (query.data) setRows(query.data);
  }, [query.data]);
  const shown = rows.filter(
    (row) =>
      `${row.customer} ${row.product} ${row.id}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "All" || row.status === status),
  );
  const start = (row?: Order) => {
    setEditing(row ?? null);
    setForm(
      row
        ? {
            customer: row.customer,
            product: row.product,
            paymentMethod: row.paymentMethod,
            quantity: String(row.quantity),
            total: String(row.total),
            status: row.status,
          }
        : {
            customer: "",
            product: "",
            paymentMethod: "Card",
            quantity: "1",
            total: "",
            status: "Pending",
          },
    );
    setOpen(true);
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      quantity: Number(form.quantity),
      total: Number(form.total),
    };
    if (editing)
      update.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            show("Order updated");
            setOpen(false);
          },
          onError: () => show("Order update failed. Please try again."),
        },
      );
    else
      create.mutate(
        { data },
        {
          onSuccess: (created) => {
            setRows([created, ...rows]);
            show("Order created");
            setOpen(false);
          },
          onError: () => show("Order could not be saved. Please try again."),
        },
      );
  };
  const destroy = (row: Order) => {
    if (!window.confirm(`Delete order #${row.id}?`)) return;
    remove.mutate(
      { id: row.id },
      {
        onSuccess: () => {
          setRows(rows.filter((item) => item.id !== row.id));
          show("Order deleted");
        },
        onError: () => show("Order could not be deleted. Please try again."),
      },
    );
  };
  const periodRows = rows.filter((row) => withinPeriod(row.date, chartPeriod));
  const pendingRows = periodRows.filter(
    (row) => row.status === "Pending" || row.status === "Processing",
  );
  const pending = pendingRows.length;
  const revenue = periodRows.reduce((sum, row) => sum + row.total, 0);
  const orderChart = groupedTotals(periodRows, (row) => shortDate(row.date), () => 1);
  const pendingChart = new Map(groupedTotals(pendingRows, (row) => shortDate(row.date), () => 1).map((item) => [item.name, item.total]));
  return (
    <div>
      <PageHeading
        eyebrow="Commerce / Fulfillment"
        title="Orders Management"
        description="Track every order from counter to completed pickup."
        action={
          <Button onClick={() => start()} data-testid="button-add-order">
            <Plus size={16} />
            Create order
          </Button>
        }
      />
      <div className="mb-4 grid gap-4 xl:grid-cols-[1.9fr_1fr]">
        <Panel className="p-4">
          <PanelHeader
            title="Total Orders"
            action={
              <div className="flex items-center gap-4 text-[9px]">
                <span className="flex items-center gap-1">
                  <i className="size-2 rounded-full bg-[#43c0b3]" />
                  Orders
                </span>
                <span className="flex items-center gap-1">
                  <i className="size-2 rounded-full bg-[#efa7b0]" />
                  Pending
                </span>
                <PeriodButton label={chartPeriod} onChange={setChartPeriod} />
              </div>
            }
          />
          <OrdersLineVisual current={orderChart.map((item) => item.total)} previous={orderChart.map((item) => pendingChart.get(item.name) ?? 0)} labels={orderChart.map((item) => item.name)} />
        </Panel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Panel className="p-4">
            <PanelHeader title="Revenue From Orders" />
            <div className="grid grid-cols-[1fr_1.15fr] items-end">
              <div>
                <p className="text-2xl font-medium">{money(revenue)}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  For {chartPeriod.toLowerCase()}
                </p>
              </div>
              <LineVisual compact values={periodRows.slice(-8).map((row) => row.total)} labels={periodRows.slice(-8).map((row) => shortDate(row.date))} />
            </div>
          </Panel>
          <Panel className="p-4">
            <PanelHeader title="Pending Orders" />
            <div className="grid grid-cols-[1fr_1.15fr] items-end">
              <div>
                <p className="text-2xl font-medium">{pending}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  For {chartPeriod.toLowerCase()}
                </p>
              </div>
              <LineVisual pink compact values={pendingRows.slice(-8).map((row) => row.total)} labels={pendingRows.slice(-8).map((row) => shortDate(row.date))} />
            </div>
          </Panel>
        </div>
      </div>
      <Panel className="overflow-hidden">
        <div className="px-4 pt-4">
          <h3 className="text-[17px] font-medium">Recent Orders</h3>
        </div>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search order or customer..."
          />
          <SelectField
            label=""
            aria-label="Filter order status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={["All", "Pending", "Processing", "Completed", "Cancelled"]}
          />
        </div>
        {query.isLoading ? (
          <LoadingRows />
        ) : shown.length ? (
          <TableShell
            headers={[
              "Order",
              "Customer",
              "Product",
              "Qty",
              "Total",
              "Payment",
              "Status",
              "Date",
              "",
            ]}
          >
            {shown.slice((page - 1) * pageSize, page * pageSize).map((row) => (
              <Row key={row.id}>
                <Cell className="font-mono font-bold">#{row.id}</Cell>
                <Cell>
                  <div className="flex items-center gap-2">
                    <Initials name={row.customer} />
                    {row.customer}
                  </div>
                </Cell>
                <Cell>{row.product}</Cell>
                <Cell className="font-mono">{row.quantity}</Cell>
                <Cell className="font-mono font-semibold">
                  {money(row.total)}
                </Cell>
                <Cell>{row.paymentMethod}</Cell>
                <Cell>
                  <StatusPill status={row.status} />
                </Cell>
                <Cell className="text-muted-foreground">
                  {shortDate(row.date)}
                </Cell>
                <Cell>
                  <div className="flex justify-end gap-1">
                    <button
                      data-testid={`button-edit-order-${row.id}`}
                      onClick={() => start(row)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      data-testid={`button-delete-order-${row.id}`}
                      onClick={() => destroy(row)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-[#bd4b43]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Cell>
              </Row>
            ))}
          </TableShell>
        ) : (
          <EmptyState
            label="No orders match these filters."
            action={
              <Button onClick={() => start()}>
                <Plus size={14} />
                Create order
              </Button>
            }
          />
        )}
      </Panel>
      <PaginationBar total={shown.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      <Modal
        open={open}
        title={editing ? "Edit order" : "Create order"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Customer"
              required
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
            />
            <Field
              label="Product"
              required
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
            />
            <Field
              label="Quantity"
              type="number"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Field
              label="Order total"
              type="number"
              step="0.01"
              required
              value={form.total}
              onChange={(e) => setForm({ ...form, total: e.target.value })}
            />
            <SelectField
              label="Payment method"
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
              options={["Card", "Cash", "Insurance", "Transfer"]}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={["Pending", "Processing", "Completed", "Cancelled"]}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-order">
              <Save size={14} />
              Save order
            </Button>
          </div>
        </form>
      </Modal>
      {message && <Feedback message={message} />}
    </div>
  );
}

export function SalesPage() {
  const query = useListSales();
  const [range, setRange] = useState("All time");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleForm, setSaleForm] = useState({ customer: "", product: "", category: "", quantity: "1", total: "", date: "" });
  const { message, show } = useFeedback();
  const client = useQueryClient();
  const remove = useDeleteSale();
  const updateSale = useUpdateSale();
  const sales = query.data ?? [];
  const rangeSales = sales.filter((row) => withinPeriod(row.date, range));
  const total = rangeSales.reduce((sum, row) => sum + row.total, 0);
  const categorySales = groupedTotals(rangeSales, (row) => row.category, (row) => row.total);
  const salesTrend = groupedTotals(rangeSales, (row) => shortDate(row.date), (row) => row.total).slice(-8);
  const visibleSales = rangeSales
    .filter((row) => `${row.customer} ${row.product} ${row.category}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.total - a.total);
  const deleteSale = (id: number) => {
    if (!window.confirm("Remove this sale?")) return;
    remove.mutate({ id }, { onSuccess: () => { client.invalidateQueries({ queryKey: getListSalesQueryKey() }); show("Sale removed"); }, onError: () => show("Could not remove sale") });
  };
  const editSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleForm({ customer: sale.customer, product: sale.product, category: sale.category, quantity: String(sale.quantity), total: String(sale.total), date: sale.date.slice(0, 10) });
  };
  const saveSale = (event: FormEvent) => {
    event.preventDefault();
    if (!editingSale) return;
    updateSale.mutate({ id: editingSale.id, data: { ...saleForm, quantity: Number(saleForm.quantity), total: Number(saleForm.total) } }, {
      onSuccess: () => { setEditingSale(null); show("Sale updated"); },
      onError: () => show("Sale update failed"),
    });
  };
  return (
    <div>
      <PageHeading
        title="Sales Overview"
        action={
          <Button
            onClick={() => { downloadCsv("sales-report.csv", [["Customer", "Product", "Category", "Quantity", "Total", "Date"], ...visibleSales.map((row) => [row.customer, row.product, row.category, row.quantity, row.total, row.date])]); show("Sales report downloaded"); }}
            data-testid="button-export-sales"
          >
            <Download size={13} />
            Export Report
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1.7fr_.8fr]">
        <Panel className="p-4">
          <PanelHeader
            title="Total Sale"
            action={<PeriodButton label={range} options={["This Week", "This Month", "This Year", "All time"]} onChange={(value) => { setRange(value); setPage(1); }} />}
          />
          <p className="text-[24px] font-medium">{money(total)}</p>
          <p className="text-[9px] text-muted-foreground">{rangeSales.length} recorded transactions for {range.toLowerCase()}.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <MetricCard
              label="Sales Revenue"
              value={money(total)}
              change={range}
              tone="rose"
            />
            <MetricCard
              label="Average Sale"
              value={money(rangeSales.length ? total / rangeSales.length : 0)}
              change={range}
              tone="blue"
            />
            <MetricCard
              label="Transactions"
              value={rangeSales.length.toLocaleString()}
              change={range}
              tone="mint"
            />
          </div>
        </Panel>
        <Panel className="p-4">
          <PanelHeader
            title="Total Order"
            action={<ShoppingCart size={13} />}
          />
          <p className="text-[21px] font-medium">
            {rangeSales.length}{" "}
            <span className="rounded-full bg-[#dff5e8] px-2 py-1 text-[8px] text-[#3aa579]">{range}</span>
          </p>
          <p className="text-[9px] text-muted-foreground">Calculated from saved sales records.</p>
          <div className="mt-4">
            <LineVisual pink values={salesTrend.map((item) => item.total)} labels={salesTrend.map((item) => item.name)} />
          </div>
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[.72fr_1.28fr]">
        <Panel className="p-4">
          <PanelHeader title="Revenue By Category" />
          <DonutVisual center={money(total)} values={categorySales.map((item) => item.total)} labels={categorySales.map((item) => item.name)} />
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-[9px] text-muted-foreground">
            {categorySales.map((item, index) => <span key={item.name} className="flex items-center gap-1"><i className="size-2 rounded-full" style={{ backgroundColor: ["#82d4ca", "#f3aeb7", "#cce995", "#a6afe7"][index % 4] }} />{item.name}</span>)}
          </div>
        </Panel>
        <Panel className="p-4">
          <PanelHeader
            title="Weekly Sales Performance"
            action={<PeriodButton label={range} options={["This Week", "This Month", "This Year", "All time"]} onChange={(value) => { setRange(value); setPage(1); }} />}
          />
          <BarsVisual values={salesTrend.map((item) => item.total)} labels={salesTrend.map((item) => item.name)} />
        </Panel>
      </div>
      <Panel className="mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 px-4 pb-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[16px] font-medium">Top Selling Products</h3>
          <div className="flex flex-wrap gap-2">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search..."
            />
            <SelectField
              label=""
              value={range}
              onChange={(event) => setRange(event.target.value)}
              options={["All time", "Last 7 days", "Last 30 days", "This quarter", "This Year"]}
            />
            <Button
              variant="secondary"
              onClick={() => {
                downloadCsv("top-selling-products.csv", [
                  ["Customer", "Product", "Category", "Quantity", "Total", "Date"],
                  ...visibleSales.map((row) => [row.customer, row.product, row.category, row.quantity, row.total, row.date]),
                ]);
                show("Sales exported");
              }}
              aria-label="Export top selling products"
            >
              <Download size={14} />
              Export
            </Button>
          </div>
        </div>
        <TableShell
          headers={[
            "Name",
            "Product Name",
            "Category",
            "Quantity",
            "Total Price",
            "Expiry Date",
            "",
          ]}
        >
          {visibleSales.slice((page - 1) * pageSize, page * pageSize).map((row) => (
            <Row key={row.id}>
              <Cell>
                <div className="flex items-center gap-2">
                  <Initials name={row.customer} />
                  {row.customer}
                </div>
              </Cell>
              <Cell>{row.product}</Cell>
              <Cell>{row.category}</Cell>
              <Cell>
                <QuantityStepper value={row.quantity} onChange={(quantity) => updateSale.mutate({ id: row.id, data: { quantity, total: (row.total / Math.max(row.quantity, 1)) * quantity } }, { onError: () => show("Quantity update failed") })} />
              </Cell>
              <Cell>{money(row.total)}</Cell>
              <Cell>{shortDate(row.date)}</Cell>
              <Cell>
                <div className="flex">
                  <button className="action-icon" onClick={() => editSale(row)} aria-label={`Edit sale ${row.id}`}>
                    <Pencil size={12} />
                  </button>
                  <button className="action-icon" onClick={() => deleteSale(row.id)} aria-label={`Delete sale ${row.id}`}>
                    <Trash2 size={12} />
                  </button>
                  <button className="action-icon" onClick={() => show(`${row.customer} bought ${row.quantity} × ${row.product}`)} aria-label={`View sale ${row.id} details`}>
                    <MoreHorizontal size={12} />
                  </button>
                </div>
              </Cell>
            </Row>
          ))}
        </TableShell>
        <PaginationBar total={visibleSales.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </Panel>
      <Modal open={Boolean(editingSale)} title="Edit sale" onClose={() => setEditingSale(null)}>
        <form onSubmit={saveSale} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer" required value={saleForm.customer} onChange={(event) => setSaleForm({ ...saleForm, customer: event.target.value })} />
            <Field label="Product" required value={saleForm.product} onChange={(event) => setSaleForm({ ...saleForm, product: event.target.value })} />
            <Field label="Category" required value={saleForm.category} onChange={(event) => setSaleForm({ ...saleForm, category: event.target.value })} />
            <Field label="Quantity" type="number" min="1" required value={saleForm.quantity} onChange={(event) => setSaleForm({ ...saleForm, quantity: event.target.value })} />
            <Field label="Total" type="number" step="0.01" min="0" required value={saleForm.total} onChange={(event) => setSaleForm({ ...saleForm, total: event.target.value })} />
            <Field label="Date" type="date" required value={saleForm.date} onChange={(event) => setSaleForm({ ...saleForm, date: event.target.value })} />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="secondary" onClick={() => setEditingSale(null)}>Cancel</Button><Button type="submit"><Save size={14} />Save sale</Button></div>
        </form>
      </Modal>
      {message && <Feedback message={message} />}
    </div>
  );
}

function SalesPageLegacy() {
  const query = useListSales();
  const ordersQuery = useListOrders();
  const [range, setRange] = useState("Last 7 days");
  const { message, show } = useFeedback();
  const sales =
    query.data ??
    fallbackOrders.map((row) => ({
      id: row.id,
      customer: row.customer,
      product: row.product,
      category: "Antibiotics",
      quantity: row.quantity,
      total: row.total,
      date: row.date,
    }));
  const total = sales.reduce((sum, row) => sum + row.total, 0);
  const grouped = sales.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.total;
    return acc;
  }, {});
  return (
    <div>
      <PageHeading
        eyebrow="Commerce / Revenue"
        title="Sales"
        description="A clear view of revenue, product mix, and recent transactions."
        action={
          <Button
            variant="secondary"
            onClick={() => show("Sales export prepared")}
            data-testid="button-export-sales"
          >
            <Download size={15} />
            Export CSV
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Gross revenue"
          value={money(total || 12648.4)}
          change="+18.2% vs prior period"
          tone="mint"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Average sale"
          value={money((total || 12648.4) / Math.max(sales.length, 1))}
          tone="blue"
          icon={WalletCards}
        />
        <MetricCard
          label="Units sold"
          value={String(sales.reduce((sum, row) => sum + row.quantity, 0))}
          tone="yellow"
          icon={PackageOpen}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold">
                Category performance
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Revenue contribution this period
              </p>
            </div>
            <SelectField
              label=""
              aria-label="Sales range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              options={["Last 7 days", "Last 30 days", "This quarter"]}
            />
          </div>
          <div className="space-y-5">
            {Object.entries(grouped).length ? (
              Object.entries(grouped).map(([category, value], index) => (
                <div key={category}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold">{category}</span>
                    <span className="font-mono font-bold">{money(value)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${["bg-primary", "bg-[#f0bf66]", "bg-[#70a9c1]", "bg-[#9e88bf]"][index % 4]}`}
                      style={{
                        width: `${Math.min(100, (value / Math.max(total, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState label="Sales data will appear here after your first completed order." />
            )}
          </div>
        </Panel>
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold">Sales pulse</h3>
              <p className="mt-1 text-xs text-muted-foreground">Daily rhythm</p>
            </div>
            <Trend value={18.2} />
          </div>
          <div className="flex h-44 items-end gap-3">
            {[34, 48, 43, 72, 61, 84, 68].map((height, index) => (
              <div
                key={index}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className={`w-full rounded-t-md ${index === 5 ? "bg-primary" : "bg-[#c1e7de]"} transition group-hover:brightness-95`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel className="mt-5">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-mono text-sm font-bold">Sale records</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {sales.length} transactions in selected range
            </p>
          </div>
          <Link
            href="/orders"
            data-testid="link-sales-orders"
            className="text-xs font-semibold text-primary"
          >
            View orders <ArrowRight className="ml-1 inline" size={13} />
          </Link>
        </div>
        <TableShell
          headers={["Customer", "Product", "Category", "Qty", "Total", "Date"]}
        >
          {sales.map((row) => (
            <Row key={row.id}>
              <Cell>
                <div className="flex items-center gap-2">
                  <Initials name={row.customer} />
                  {row.customer}
                </div>
              </Cell>
              <Cell className="font-medium">{row.product}</Cell>
              <Cell>{row.category}</Cell>
              <Cell className="font-mono">{row.quantity}</Cell>
              <Cell className="font-mono font-semibold">
                {money(row.total)}
              </Cell>
              <Cell className="text-muted-foreground">
                {shortDate(row.date)}
              </Cell>
            </Row>
          ))}
        </TableShell>
      </Panel>
      {message && <Feedback message={message} />}
    </div>
  );
}

export function CustomersPage() {
  const query = useListCustomers();
  const [rows, setRows] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
    allergies: "",
    conditions: "",
    prescriptions: "",
    notes: "",
    loyaltyPoints: "0",
    consent: false,
  });
  const { message, show } = useFeedback();
  const client = useQueryClient();
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const remove = useDeleteCustomer();
  useEffect(() => {
    if (query.data) setRows(query.data);
  }, [query.data]);
  const shown = rows.filter((row) =>
    `${row.name} ${row.email} ${row.phone}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const start = (row?: Customer) => {
    setEditing(row ?? null);
    setForm(
      row
        ? {
            name: row.name,
            email: row.email,
            phone: row.phone,
            status: row.status,
            allergies: row.allergies ?? "",
            conditions: row.conditions ?? "",
            prescriptions: row.prescriptions ?? "",
            notes: row.notes ?? "",
            loyaltyPoints: String(row.loyaltyPoints ?? 0),
            consent: row.consent ?? false,
          }
        : { name: "", email: "", phone: "", status: "Active", allergies: "", conditions: "", prescriptions: "", notes: "", loyaltyPoints: "0", consent: false },
    );
    setOpen(true);
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    const data = { ...form, loyaltyPoints: Number(form.loyaltyPoints || 0) };
    if (editing)
      update.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            client.invalidateQueries({ queryKey: getListCustomersQueryKey() });
            show("Customer updated");
            setOpen(false);
          },
          onError: () => show("Customer update failed. Please try again."),
        },
      );
    else
      create.mutate(
        { data },
        {
          onSuccess: (created) => {
            setRows([created, ...rows]);
            show("Customer added");
            setOpen(false);
          },
          onError: () => show("Customer could not be saved. Please try again."),
        },
      );
  };
  const destroy = (row: Customer) => {
    if (!window.confirm(`Remove ${row.name}?`)) return;
    remove.mutate(
      { id: row.id },
      {
        onSuccess: () => {
          setRows(rows.filter((item) => item.id !== row.id));
          show("Customer removed");
        },
        onError: () => show("Customer could not be removed. Please try again."),
      },
    );
  };
  return (
    <div>
      <PageHeading
        eyebrow="People / Directory"
        title="Customers"
        description="Know who relies on your pharmacy and how you serve them."
        action={
          <Button onClick={() => start()} data-testid="button-add-customer">
            <Plus size={16} />
            Add customer
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total customers"
          value={String(rows.length)}
          tone="mint"
          icon={Users}
        />
        <MetricCard
          label="Active this month"
          value={String(rows.filter((row) => row.status === "Active").length)}
          tone="blue"
          icon={Activity}
        />
        <MetricCard
          label="Customer value"
          value={money(rows.reduce((sum, row) => sum + row.spent, 0))}
          tone="yellow"
          icon={CircleDollarSign}
        />
      </div>
      <Panel>
        <div className="border-b border-border p-4">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search name, email, or phone..."
          />
        </div>
        {query.isLoading ? (
          <LoadingRows />
        ) : shown.length ? (
          <TableShell
            headers={[
              "Customer",
              "Contact",
              "Orders",
              "Total spent",
              "Status",
              "",
            ]}
          >
            {shown.map((row) => (
              <Row key={row.id}>
                <Cell>
                  <div className="flex items-center gap-3">
                    <Initials name={row.name} />
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.email}
                      </p>
                      {(row.allergies || row.conditions) && (
                        <p className="mt-1 text-[10px] text-rose-700">Medical notes on file</p>
                      )}
                    </div>
                  </div>
                </Cell>
                <Cell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={13} />
                    {row.phone}
                  </div>
                </Cell>
                <Cell className="font-mono">{row.orders}</Cell>
                <Cell className="font-mono font-semibold">
                  {money(row.spent)}
                </Cell>
                <Cell>
                  <StatusPill status={row.status} />
                </Cell>
                <Cell>
                  <div className="flex justify-end gap-1">
                    <button
                      data-testid={`button-edit-customer-${row.id}`}
                      onClick={() => start(row)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      data-testid={`button-delete-customer-${row.id}`}
                      onClick={() => destroy(row)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-[#fff0ee] hover:text-[#bd4b43]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Cell>
              </Row>
            ))}
          </TableShell>
        ) : (
          <EmptyState
            label="No customers match your search."
            action={
              <Button onClick={() => start()}>
                <Plus size={14} />
                Add customer
              </Button>
            }
          />
        )}
      </Panel>
      <Modal
        open={open}
        title={editing ? "Edit customer" : "Add customer"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          <Field
            label="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Field
              label="Phone"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <SelectField
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={["Active", "Inactive"]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Allergies" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. Penicillin" />
            <Field label="Chronic conditions" value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder="e.g. Diabetes" />
            <Field label="Prescriptions" value={form.prescriptions} onChange={(e) => setForm({ ...form, prescriptions: e.target.value })} placeholder="Prescription references" />
            <Field label="Loyalty points" type="number" min="0" value={form.loyaltyPoints} onChange={(e) => setForm({ ...form, loyaltyPoints: e.target.value })} />
          </div>
          <Field label="Private notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <label className="flex items-start gap-3 rounded-2xl border border-border bg-white/50 p-3 text-xs">
            <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-0.5 size-4" />
            <span><b>Customer consent recorded</b><small className="mt-1 block text-muted-foreground">Required before storing medical notes and prescription details.</small></span>
          </label>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-customer">
              <Save size={14} />
              Save customer
            </Button>
          </div>
        </form>
      </Modal>
      {message && <Feedback message={message} />}
    </div>
  );
}

export function PaymentsPage() {
  const query = useListPayments();
  const [rows, setRows] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    amount: "",
    method: "Card",
    status: "Paid",
  });
  const { message, show } = useFeedback();
  const create = useCreatePayment();
  useEffect(() => {
    if (query.data) setRows(query.data);
  }, [query.data]);
  const save = (e: FormEvent) => {
    e.preventDefault();
    const data = { ...form, amount: Number(form.amount) };
    create.mutate(
      { data },
      {
        onSuccess: (created) => {
          setRows([created, ...rows]);
          show("Payment recorded");
          setOpen(false);
        },
        onError: () => show("Payment could not be recorded. Please try again."),
      },
    );
  };
  const filteredPayments = rows.filter((row) => `${row.reference} ${row.customer} ${row.method}`.toLowerCase().includes(search.toLowerCase()) && (paymentStatus === "All" || row.status === paymentStatus));
  const collected = filteredPayments
    .filter((row) => row.status === "Paid")
    .reduce((sum, row) => sum + row.amount, 0);
  const pending = filteredPayments
    .filter((row) => row.status === "Pending")
    .reduce((sum, row) => sum + row.amount, 0);
  return (
    <div>
      <PageHeading
        eyebrow="Finance / Ledger"
        title="Payments"
        description="Reconcile incoming money without losing the thread."
        action={
          <Button
            onClick={() => {
              setForm({
                customer: "",
                amount: "",
                method: "Card",
                status: "Paid",
              });
              setOpen(true);
            }}
            data-testid="button-add-payment"
          >
            <Plus size={16} />
            Record payment
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Collected"
          value={money(collected)}
          change="From saved records"
          tone="mint"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Pending"
          value={money(pending)}
          tone="yellow"
          icon={Clock3}
        />
        <MetricCard
          label="Transactions"
          value={String(filteredPayments.length)}
          tone="blue"
          icon={CreditCardIcon}
        />
      </div>
      <Panel>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="font-mono text-sm font-bold">Payment ledger</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              All recorded payment activity
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:flex-nowrap">
            <SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search payments..." />
            <div className="w-28 shrink-0">
              <SelectField label="" value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }} options={["All", "Paid", "Pending", "Failed"]} />
            </div>
            <Button variant="secondary" onClick={() => { downloadCsv("payments.csv", [["Reference", "Customer", "Amount", "Method", "Status", "Date"], ...filteredPayments.map((row) => [row.reference, row.customer, row.amount, row.method, row.status, row.date])]); show("Payments downloaded"); }} data-testid="button-export-payments"><Download size={14} />Export</Button>
          </div>
        </div>
        {query.isLoading ? (
          <LoadingRows />
        ) : filteredPayments.length ? (
          <TableShell
            headers={[
              "Reference",
              "Customer",
              "Amount",
              "Method",
              "Status",
              "Date",
            ]}
          >
            {filteredPayments.slice((page - 1) * pageSize, page * pageSize).map((row) => (
              <Row key={row.id}>
                <Cell className="font-mono font-bold text-primary">
                  {row.reference}
                </Cell>
                <Cell>
                  <div className="flex items-center gap-2">
                    <Initials name={row.customer} />
                    {row.customer}
                  </div>
                </Cell>
                <Cell className="font-mono font-semibold">
                  {money(row.amount)}
                </Cell>
                <Cell>{row.method}</Cell>
                <Cell>
                  <StatusPill status={row.status} />
                </Cell>
                <Cell className="text-muted-foreground">
                  {shortDate(row.date)}
                </Cell>
              </Row>
            ))}
          </TableShell>
        ) : (
          <EmptyState
            label="No payment records yet."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus size={14} />
                Record payment
              </Button>
            }
          />
        )}
        <PaginationBar total={filteredPayments.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </Panel>
      <Modal open={open} title="Record payment" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-4">
          <Field
            label="Customer"
            required
            value={form.customer}
            onChange={(e) => setForm({ ...form, customer: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Amount"
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <SelectField
              label="Method"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              options={["Card", "Cash", "Insurance", "Transfer"]}
            />
          </div>
          <SelectField
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={["Paid", "Pending", "Failed"]}
          />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-payment">
              <Save size={14} />
              Record payment
            </Button>
          </div>
        </form>
      </Modal>
      {message && <Feedback message={message} />}
    </div>
  );
}
function CreditCardIcon({ size }: { size?: number }) {
  return <WalletCards size={size} />;
}

export function ReportsPage() {
  const salesQuery = useListSales();
  const ordersQuery = useListOrders();
  const [reportPeriod, setReportPeriod] = useState("All time");
  const { message, show } = useFeedback();
  const sales = (salesQuery.data ?? []).filter((row) => withinPeriod(row.date, reportPeriod));
  const orders = (ordersQuery.data ?? []).filter((row) => withinPeriod(row.date, reportPeriod));
  const categoryTotals = groupedTotals(sales, (row) => row.category, (row) => row.total);
  const summary = {
    revenue: sales.reduce((sum, row) => sum + row.total, 0),
    orders: orders.length,
    averageOrder: orders.length ? orders.reduce((sum, row) => sum + row.total, 0) / orders.length : 0,
    byCategory: categoryTotals.map((item) => ({ label: item.name, value: item.total })),
  };
  const trend = groupedTotals(sales, (row) => shortDate(row.date), (row) => row.total).slice(-12);
  const leadingCategory = [...summary.byCategory].sort((a, b) => b.value - a.value)[0];
  const max = Math.max(...summary.byCategory.map((item) => item.value), 1);
  return (
    <div>
      <PageHeading
        eyebrow="Insights / Performance"
        title="Reports"
        description="The few numbers worth carrying into your next decision."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodButton label={reportPeriod} onChange={setReportPeriod} />
            <Button
            variant="secondary"
            onClick={() => { downloadCsv("pharmacy-report.csv", [["Metric", "Value"], ["Revenue", summary.revenue], ["Orders fulfilled", summary.orders], ["Average order", summary.averageOrder], ...summary.byCategory.map((item) => [`Category: ${item.label}`, item.value])]); show("Report downloaded"); }}
            data-testid="button-download-report"
          >
            <Download size={15} />
            Download report
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Revenue"
          value={money(summary.revenue)}
          change={reportPeriod}
          tone="mint"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Orders fulfilled"
          value={summary.orders.toLocaleString()}
          change={reportPeriod}
          tone="blue"
          icon={ShoppingCart}
        />
        <MetricCard
          label="Average order"
          value={money(summary.averageOrder)}
          tone="yellow"
          icon={WalletCards}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold">Revenue trend</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {reportPeriod}
              </p>
            </div>
            <span className="rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-primary">{trend.length} points</span>
          </div>
          <div className="h-56"><LineVisual values={trend.map((item) => item.total)} labels={trend.map((item) => item.name)} /></div>
        </Panel>
        <Panel className="p-5">
          <div className="mb-5">
            <h3 className="font-mono text-sm font-bold">
              Category contribution
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Where revenue is coming from
            </p>
          </div>
          <div className="space-y-5">
            {summary.byCategory.map((item, index) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold">{item.label}</span>
                  <span className="font-mono">{money(item.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${["bg-primary", "bg-[#f0bf66]", "bg-[#70a9c1]", "bg-[#9e88bf]"][index % 4]}`}
                    style={{
                      width: `${Math.max(8, (item.value / max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#f7faf7] p-3 text-[11px] text-muted-foreground">
            <ShieldCheck size={16} className="text-primary" />
            Reports use saved sales and orders.
          </div>
        </Panel>
      </div>
      <Panel className="mt-5 p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
            <FileText size={17} />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold">Operational readout</h3>
            <p className="mt-1 text-xs text-muted-foreground">
               {leadingCategory ? `${leadingCategory.label} currently leads revenue at ${money(leadingCategory.value)} for ${reportPeriod.toLowerCase()}.` : "Add sales records to generate an operational readout."}
            </p>
          </div>
        </div>
      </Panel>
      {message && <Feedback message={message} />}
    </div>
  );
}

export function SettingsPage() {
  const query = useGetSettings();
  const update = useUpdateSettings();
  const [saved, setSaved] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: "Inventory setup",
    contact: "",
    message: "",
  });
  const [form, setForm] = useState({
    pharmacyName: "Pharmacy",
    email: "budiono.siregar@gmail.com",
    phone: "+20 100 000 0000",
    address: "New Cairo, Egypt",
    currency: "EGP",
    notifications: true,
    taxRate: 0,
    lowStockThreshold: 10,
    receiptFooter: "Thank you for choosing our pharmacy.",
  });
  const { message, show } = useFeedback();
  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);
  const save = (e: FormEvent) => {
    e.preventDefault();
    update.mutate(
      { data: form },
      {
        onSuccess: () => {
          setSaved(true);
          show("Settings saved");
          window.setTimeout(() => setSaved(false), 2500);
        },
        onError: () => show("Settings could not be saved. Please try again."),
      },
    );
  };
  const openSupport = () => {
    setSupportForm((current) => ({ ...current, contact: current.contact || form.email }));
    setSupportOpen(true);
  };
  const sendSupportRequest = async (event: FormEvent) => {
    event.preventDefault();
    setSupportSending(true);
    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Support request failed");
      setSupportOpen(false);
      setSupportForm({ subject: "Inventory setup", contact: form.email, message: "" });
      show(`Support ticket #${result.id} created`);
    } catch (error) {
      show(error instanceof Error ? error.message : "Support request failed");
    } finally {
      setSupportSending(false);
    }
  };
  return (
    <div>
      <PageHeading
        eyebrow="Workspace / Preferences"
        title="Settings"
        description="Make Pharmacy feel like your pharmacy."
      />
      <form onSubmit={save} className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Panel className="p-5 sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
              <SettingsIcon />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold">Pharmacy profile</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                This information appears on receipts and customer
                communications.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Pharmacy name"
              value={form.pharmacyName}
              onChange={(e) =>
                setForm({ ...form, pharmacyName: e.target.value })
              }
            />
            <Field
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Field
              label="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Field
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <Field
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Default tax rate (%)"
              type="number"
              min="0"
              step="0.01"
              value={form.taxRate}
              onChange={(e) =>
                setForm({ ...form, taxRate: Number(e.target.value) })
              }
            />
            <Field
              label="Default low-stock threshold"
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={(e) =>
                setForm({
                  ...form,
                  lowStockThreshold: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="mt-4">
            <Field
              label="Receipt footer"
              value={form.receiptFooter}
              onChange={(e) =>
                setForm({ ...form, receiptFooter: e.target.value })
              }
            />
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  Operational notifications
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Get a quiet nudge when stock is low or a payment needs review.
                </p>
              </div>
              <button
                type="button"
                data-testid="button-toggle-notifications"
                onClick={() =>
                  setForm({ ...form, notifications: !form.notifications })
                }
                className={`relative h-6 w-11 rounded-full transition ${form.notifications ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${form.notifications ? "left-6" : "left-1"}`}
                />
              </button>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-end gap-3">
            <span
              className={`text-xs font-semibold text-primary transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}
            >
              Changes saved
            </span>
            <Button type="submit" data-testid="button-save-settings">
              <Save size={15} />
              Save changes
            </Button>
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel className="p-5">
            <h3 className="font-mono text-sm font-bold">Workspace health</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Activity size={14} />
                  API connection
                </span>
                <span className="font-semibold text-[#3b947e]">Connected</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck size={14} />
                  Data protection
                </span>
                <span className="font-semibold text-[#3b947e]">Active</span>
              </div>
            </div>
          </Panel>
          <Panel className="bg-gradient-to-br from-[#9debe2] to-[#d8f7f2] p-5 text-foreground">
            <div className="mb-5 flex items-center gap-2">
              <PillIcon />
              <span className="font-mono text-sm font-bold">Need a hand?</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Our support team is available for inventory setup, integrations,
              and staff onboarding.
            </p>
            <button
              type="button"
              data-testid="button-contact-support"
              onClick={openSupport}
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#00645f]"
            >
              Contact support <ArrowRight size={14} />
            </button>
          </Panel>
        </div>
      </form>
      <Modal open={supportOpen} title="Contact support" onClose={() => setSupportOpen(false)}>
        <form onSubmit={sendSupportRequest} className="space-y-4">
          <SelectField
            label="How can we help?"
            value={supportForm.subject}
            onChange={(event) => setSupportForm({ ...supportForm, subject: event.target.value })}
            options={["Inventory setup", "Integrations", "Staff onboarding", "Billing question", "Technical issue"]}
          />
          <Field
            label="Contact email"
            type="email"
            required
            value={supportForm.contact}
            onChange={(event) => setSupportForm({ ...supportForm, contact: event.target.value })}
          />
          <label className="block space-y-1.5">
            <span className="text-[10px] font-semibold text-[#34585b]">Tell us what you need</span>
            <textarea
              required
              maxLength={2000}
              rows={5}
              value={supportForm.message}
              onChange={(event) => setSupportForm({ ...supportForm, message: event.target.value })}
              placeholder="Describe the issue and what you were trying to do..."
              className="w-full resize-none rounded-2xl border border-border bg-white/65 px-4 py-3 text-xs outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setSupportOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={supportSending || !supportForm.message.trim()}>
              <ArrowRight size={14} />
              {supportSending ? "Sending..." : "Send request"}
            </Button>
          </div>
        </form>
      </Modal>
      {message && <Feedback message={message} />}
    </div>
  );
}
function SettingsIcon() {
  return <span className="text-sm font-bold">S</span>;
}
