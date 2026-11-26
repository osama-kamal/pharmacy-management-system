import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useI18n, type Language } from "@/lib/i18n-context";
import { useGetSettings } from "@workspace/api-client-react";
import { dropdownItemClass, dropdownMenuClass } from "@/components/ui-kit";
import {
  BarChart3,
  BellDot,
  Boxes,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  Globe2,
  LayoutDashboard,
  Menu,
  PackageCheck,
  PackageSearch,
  Search,
  ScanLine,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  X,
} from "lucide-react";

const navGroups = [
  {
    label: "MAIN MENU",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pos", label: "Point of Sale", icon: ScanLine },
      { href: "/products", label: "Products", icon: PackageCheck },
      { href: "/categories", label: "Categories", icon: Boxes },
    ],
  },
  {
    label: "LEADS",
    collapsible: true,
    items: [
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/sales", label: "Sales", icon: BarChart3 },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/inventory-control", label: "Inventory Control", icon: PackageSearch },
      { href: "/supply-chain", label: "Suppliers & Purchasing", icon: Truck },
    ],
  },
  {
    label: "COMMS",
    collapsible: true,
    items: [
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/reports", label: "Reports", icon: CircleDollarSign },
      { href: "/administration", label: "Administration", icon: ShieldCheck },
      { href: "/settings", label: "Settings", icon: Settings2 },
    ],
  },
];

export function PharmacyShell({ children }: { children: ReactNode }) {
  const { user, logout: signOut } = useAuth();
  const { language, setLanguage } = useI18n();
  const settingsQuery = useGetSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [location, navigate] = useLocation();
  const activePath = location.split("?")[0].replace(/\/$/, "") || "/";

  useEffect(() => {
    const pharmacyName = settingsQuery.data?.pharmacyName ?? "Pharmacy";
    document.title =
      language === "AR"
        ? `${pharmacyName} | إدارة ذكية`
        : `${pharmacyName} OS`;
  }, [language, settingsQuery.data?.pharmacyName]);

  useEffect(() => {
    setMobileOpen(false);
    setLanguageOpen(false);
    setProfileOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  const chooseLanguage = (value: Language) => {
    setLanguage(value);
    setLanguageOpen(false);
  };

  const submitGlobalSearch = () => {
    const value = search.trim();
    if (!value) return;
    navigate(`/products?search=${encodeURIComponent(value)}`);
    window.dispatchEvent(
      new CustomEvent("pharmacy-search", { detail: value }),
    );
  };

  const logout = async () => {
    await signOut();
    navigate("/login");
  };
  const completion = Math.round(
    ([user?.name, user?.phone, user?.address, user?.licenseNumber].filter(
      Boolean,
    ).length /
      4) *
      100,
  );
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PH";

  const toggleGroup = (label: string) => {
    setCollapsedGroups((groups) =>
      groups.includes(label)
        ? groups.filter((group) => group !== label)
        : [...groups, label],
    );
  };

  const canOpen = (href: string) => {
    const permissions: Record<string, string[]> = {
      "/pos": ["Owner", "Manager", "Pharmacist", "Cashier"],
      "/inventory-control": ["Owner", "Manager", "Pharmacist", "Inventory"],
      "/supply-chain": ["Owner", "Manager", "Inventory"],
      "/payments": ["Owner", "Manager", "Cashier", "Accountant"],
      "/administration": ["Owner", "Manager"],
      "/settings": ["Owner", "Manager"],
    };
    return !permissions[href] || permissions[href].includes(user?.role ?? "");
  };

  return (
    <div className="min-h-[100dvh] bg-background p-0 lg:p-2">
      <div className="app-frame mx-auto min-h-[calc(100dvh-16px)] max-w-[1600px] overflow-hidden border border-white/80 bg-background lg:rounded-[24px]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[210px] flex-col border-r border-border/55 bg-white/95 px-4 pb-4 backdrop-blur-xl transition-transform duration-300 lg:bottom-2 lg:left-[max(8px,calc((100vw-1600px)/2+8px))] lg:top-2 lg:translate-x-0 lg:rounded-l-[23px] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-[76px] items-center gap-2 px-1">
            <div className="grid size-8 place-items-center rounded-full bg-[#073f42] text-white">
              <span className="text-xl font-medium leading-none">+</span>
            </div>
            <p className="text-[21px] font-semibold tracking-[-.04em] text-foreground">
              {settingsQuery.data?.pharmacyName ?? "Pharmacy"}
            </p>
            <button
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-full p-2 text-muted-foreground hover:bg-muted lg:hidden"
            >
              <X size={17} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto pt-1 scrollbar-thin">
            {navGroups.map((group) => {
              const collapsed = collapsedGroups.includes(group.label);
              return (
                <div key={group.label} className="mb-5">
                  <button
                    type="button"
                    onClick={() =>
                      group.collapsible && toggleGroup(group.label)
                    }
                    className="mb-2 flex w-full items-center px-1.5 text-[9px] font-bold tracking-[.02em] text-[#48686b]"
                  >
                    {group.label}
                    {group.collapsible &&
                      (collapsed ? (
                        <ChevronDown className="ml-auto" size={12} />
                      ) : (
                        <ChevronUp className="ml-auto" size={12} />
                      ))}
                  </button>
                  {!collapsed && (
                    <div className="space-y-1">
                      {group.items.filter(({ href }) => canOpen(href)).map(({ href, label, icon: Icon }) => {
                        const active = activePath === href;
                        return (
                          <Link
                            href={href}
                            key={href}
                            data-testid={`link-${label.toLowerCase()}`}
                            onClick={() => setMobileOpen(false)}
                            className={`group flex h-10 items-center gap-3 rounded-full px-2.5 text-[12px] font-medium transition-all ${active ? "bg-[#003f42] text-white shadow-[0_7px_18px_rgba(0,63,66,.15)]" : "text-[#456165] hover:bg-[#e8f7f6] hover:text-[#003f42]"}`}
                          >
                            <span
                              className={`grid size-7 shrink-0 place-items-center rounded-full ${active ? "bg-white/8" : "bg-[#edf8f7] text-[#073f42] group-hover:bg-white"}`}
                            >
                              <Icon size={14} strokeWidth={2.1} />
                            </span>
                            {label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="rounded-[18px] bg-gradient-to-br from-[#bff6ed] to-[#72eee4] p-3.5 shadow-[0_14px_32px_rgba(58,206,196,.18)]">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full border-[3px] border-[#073f42] border-r-transparent text-[9px] font-bold">
                {completion}%
              </div>
              <div>
                <p className="text-[12px] font-bold">Complete Profile</p>
                <p className="text-[9px] leading-tight text-[#517376]">
                  Complete Your Profile to
                  <br /> Unlock all Features
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="mt-3 h-9 w-full rounded-full bg-[#003f42] text-[10px] font-semibold text-white transition hover:bg-[#07565a] active:scale-[.98]"
            >
              Verify Identity
            </button>
          </div>
        </aside>

        {mobileOpen && (
          <button
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-[#073f42]/25 backdrop-blur-sm lg:hidden"
          />
        )}

        <main className="min-w-0 overflow-x-hidden min-h-[calc(100dvh-16px)] lg:pl-[210px]">
          <header className="sticky top-0 z-20 flex h-[76px] items-center gap-3 border-b border-border/35 bg-background/90 px-4 backdrop-blur-xl sm:px-6">
            <button
              data-testid="button-open-navigation"
              onClick={() => setMobileOpen(true)}
              className="grid size-10 place-items-center rounded-full border border-border bg-white text-foreground lg:hidden"
            >
              <Menu size={18} />
            </button>

            <div className="relative min-w-0 flex-1 sm:max-w-[310px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#83999d]"
                size={15}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && submitGlobalSearch()}
                placeholder="Search"
                className="h-10 w-full rounded-full border border-border/80 bg-white/50 pl-11 pr-4 text-xs outline-none transition focus:border-[#68cfc5] focus:bg-white focus:ring-4 focus:ring-[#79ded4]/10"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setLanguageOpen(!languageOpen)}
                  className="flex h-10 items-center gap-2 rounded-full border border-border bg-white/70 px-3 text-[11px] text-[#34585b] hover:bg-white"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-[#edf8f7] text-[#006b68]">
                    <BellDot size={13} />
                  </span>
                  <span>{language}</span>
                  <Globe2 size={13} />
                </button>
                {languageOpen && (
                  <div className={`${dropdownMenuClass} right-0 top-10 w-40`} role="menu">
                    <button
                      onClick={() => chooseLanguage("EN")}
                      className={`${dropdownItemClass} ${language === "EN" ? "bg-[#dff4f1] font-semibold text-[#073f42]" : ""}`}
                    >
                      <span>English</span>
                      {language === "EN" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button
                      onClick={() => chooseLanguage("AR")}
                      className={`${dropdownItemClass} ${language === "AR" ? "bg-[#dff4f1] font-semibold text-[#073f42]" : ""}`}
                    >
                      <span>العربية</span>
                      {language === "AR" && <span aria-hidden="true">✓</span>}
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full px-1 py-1 text-left hover:bg-white/70"
                >
                  <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#edb37a] to-[#5b3024] text-[10px] font-bold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[12px] font-semibold leading-tight">
                      {user?.name}
                    </p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <span className="hidden text-muted-foreground md:block">
                    <ChevronUp size={12} />
                    <ChevronDown size={12} />
                  </span>
                </button>
                {profileOpen && (
                  <div className={`${dropdownMenuClass} right-0 top-10 w-52`} role="menu">
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className={`${dropdownItemClass} justify-start gap-2`}
                    >
                      <Settings2 size={14} />
                      Profile settings
                    </Link>
                    <button
                      onClick={logout}
                      className={`${dropdownItemClass} justify-start gap-2 text-[#b84f4f] hover:bg-[#fff0ee]`}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="min-w-0 min-h-[calc(100dvh-92px)] px-4 pb-7 pt-3 sm:px-6">
            <div className="page-enter mx-auto min-w-0 max-w-[1380px]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
