import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";

export const dropdownMenuClass =
  "absolute z-50 mt-2 min-w-full w-max max-w-[280px] overflow-hidden rounded-[22px] border border-[#dce9e7] bg-white p-2 text-[11px] shadow-[0_18px_45px_rgba(3,47,50,.16)]";
export const dropdownItemClass =
  "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-foreground transition hover:bg-[#eef9f7] focus-visible:bg-[#eef9f7] focus-visible:outline-none";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary:
      "bg-[#003f42] text-white hover:bg-[#07565a] shadow-[0_8px_20px_rgba(0,63,66,.14)]",
    secondary:
      "bg-white/70 text-foreground border border-border hover:bg-white",
    ghost: "text-muted-foreground hover:bg-white hover:text-foreground",
    danger: "bg-[#fff0ee] text-[#bd4b43] hover:bg-[#ffe3df]",
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-medium transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      {...props}
      className={`panel min-w-0 rounded-[25px] bg-white/56 ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex min-h-[52px] flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-[24px] font-medium tracking-[-.04em] text-foreground sm:text-[26px]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 hidden max-w-2xl text-[11px] text-muted-foreground xl:block">
            {description}
          </p>
        )}
        {eyebrow && <span className="sr-only">{eyebrow}</span>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  change,
  tone = "mint",
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: string;
  tone?: "mint" | "yellow" | "blue" | "lilac" | "rose";
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  const tones = {
    mint: "bg-gradient-to-br from-[#c8f1a6] to-[#ddf8b8] text-[#123f38]",
    yellow: "bg-gradient-to-br from-[#ffeac0] to-[#f9d998] text-[#6d531d]",
    blue: "bg-gradient-to-br from-[#aee4df] to-[#7ed7cf] text-[#124c4a]",
    lilac: "bg-gradient-to-br from-[#c9c7fb] to-[#9ea7ef] text-[#303d79]",
    rose: "bg-gradient-to-br from-[#fac1c8] to-[#f39fa8] text-[#71353a]",
  };
  return (
    <div
      className={`relative min-h-[124px] overflow-hidden rounded-[18px] p-4 ${tones[tone]}`}
    >
      <div className="mb-6 flex items-start justify-between">
        <p className="text-[10px] font-medium opacity-70">{label}</p>
        {Icon && (
          <div className="rounded-full bg-white/20 p-1.5">
            <Icon size={13} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className="text-[21px] font-semibold tracking-[-.03em]">{value}</p>
      {change && (
        <div className="mt-1 flex items-center gap-1 text-[9px] font-medium opacity-75">
          <ArrowUpRight size={11} />
          {change}
        </div>
      )}
      <div className="absolute bottom-3 right-3 flex items-end gap-1 opacity-20">
        {[13, 26, 42, 25, 55].map((height, index) => (
          <span
            key={index}
            className="w-2 rounded-t bg-current"
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search records...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full shrink-0 sm:w-[230px] sm:max-w-[230px]">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={13}
      />
      <input
        data-testid="input-search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-full border border-border bg-white/45 pl-8 pr-8 text-[10px] outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
      {value && (
        <button
          type="button"
          data-testid="button-clear-search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export function StatusPill({ status }: { status?: string }) {
  const key = (status ?? "").toLowerCase();
  const style =
    key.includes("paid") ||
    key.includes("active") ||
    key.includes("completed") ||
    key.includes("delivered") ||
    key.includes("in stock")
      ? "bg-[#d9f5ea] text-[#277263]"
      : key.includes("pending") ||
          key.includes("low") ||
          key.includes("processing")
        ? "bg-[#fff0c6] text-[#956a1f]"
        : key.includes("expired") ||
            key.includes("cancel") ||
            key.includes("out") ||
            key.includes("failed")
          ? "bg-[#fde1df] text-[#a64f45]"
          : "bg-[#e5eef3] text-[#446b78]";
  return (
    <span
      data-testid={`status-${key.replace(/\s+/g, "-")}`}
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${style}`}
    >
      {status || "Unknown"}
    </span>
  );
}

export function EmptyState({
  label,
  action,
}: {
  label: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-secondary text-primary">
        <Check size={20} />
      </div>
      <p className="text-sm font-semibold text-foreground">Nothing here yet</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{label}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingRows({ columns = 5 }: { columns?: number }) {
  return (
    <div className="space-y-3 p-5">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div
              key={index}
              className={`h-4 animate-pulse rounded-full bg-muted ${index === 0 ? "w-32" : "w-20"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#073f42]/25 p-4 backdrop-blur-[6px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-[26px] border border-white/80 bg-[#f5fcfb] shadow-[0_30px_90px_rgba(0,54,57,.24)]"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-primary">
              Pharmacy workspace
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-.03em]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            data-testid="button-close-modal"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-border bg-white/70 text-muted-foreground hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block shrink-0 space-y-1.5">
      <span className="text-[10px] font-semibold text-[#34585b]">{label}</span>
      <input
        {...props}
        className="h-11 w-full rounded-2xl border border-border bg-white/65 px-4 text-xs outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

export function SelectField({
  label,
  options,
  optionLabels,
  ...props
}: {
  label: string;
  options: string[];
  optionLabels?: Record<string, string>;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [internalValue, setInternalValue] = useState(
    String(props.defaultValue ?? options[0] ?? ""),
  );
  const rootRef = useRef<HTMLLabelElement>(null);
  const menuId = useId();
  const selectedValue = String(props.value ?? internalValue);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const choose = (option: string) => {
    if (props.value === undefined) setInternalValue(option);
    props.onChange?.({
      target: { value: option, name: props.name },
      currentTarget: { value: option, name: props.name },
    } as unknown as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  const toggle = () => {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(300, options.length * 48 + 20);
      setOpenUp(
        window.innerHeight - rect.bottom < estimatedHeight &&
          rect.top > estimatedHeight,
      );
    }
    setOpen((current) => !current);
  };

  return (
    <label ref={rootRef} className="relative block shrink-0 space-y-1.5">
      <span
        className={
          label ? "text-[10px] font-semibold text-[#34585b]" : "sr-only"
        }
      >
        {label || "Select"}
      </span>
      <div className="relative">
        <button
          type="button"
          id={props.id}
          disabled={props.disabled}
          aria-label={props["aria-label"] ?? (label || "Select")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={toggle}
          className="flex h-9 w-full min-w-24 items-center justify-between gap-3 rounded-full border border-border bg-white/55 px-3 text-[10px] outline-none transition hover:bg-white focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">
            {optionLabels?.[selectedValue] ?? selectedValue}
          </span>
          <ChevronDown size={12} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {props.name && <input type="hidden" name={props.name} value={selectedValue} />}
        {open && (
          <div id={menuId} role="listbox" className={`${dropdownMenuClass} left-0 ${openUp ? "bottom-full mb-2 mt-0" : "top-full"}`}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selectedValue === option}
                onClick={() => choose(option)}
                className={`${dropdownItemClass} ${selectedValue === option ? "bg-[#dff4f1] font-semibold text-[#073f42]" : ""}`}
              >
                <span>{optionLabels?.[option] ?? option}</span>
                {selectedValue === option && <Check size={14} className="text-[#073f42]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

export function Feedback({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-xl ${error ? "bg-[#bd4b43]" : "bg-[#003f42]"}`}
    >
      <Check size={15} />
      {message}
    </div>
  );
}

export function Trend({ value }: { value: number }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${value >= 0 ? "text-[#3b947e]" : "text-[#bd4b43]"}`}
    >
      {value >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value)}%
    </span>
  );
}
