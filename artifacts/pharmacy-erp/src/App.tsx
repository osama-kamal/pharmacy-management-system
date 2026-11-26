import { useEffect, type ReactNode } from "react";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { PharmacyShell } from "@/components/pharmacy-shell";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n-context";
import { LoginPage, ProfilePage } from "@/pages/auth-pages";
import {
  AdministrationPage,
  InventoryControlPage,
  PosPage,
  SupplyChainPage,
} from "@/pages/operations-pages";
import {
  CategoriesPage,
  CustomersPage,
  DashboardPage,
  OrdersPage,
  PaymentsPage,
  ProductsPage,
  ReportsPage,
  SalesPage,
  SettingsPage,
} from "@/pages/pharmacy-pages";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";

let queryClient: QueryClient;
queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status =
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof error.status === "number"
            ? error.status
            : undefined;
        return status !== 401 && failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  }),
});

function Router() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  useEffect(() => {
    if (!loading && !user && location !== "/login") setLocation("/login");
    if (!loading && user && location === "/login") setLocation("/");
  }, [loading, user, location, setLocation]);
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading workspace...
      </div>
    );
  if (!user) return <LoginPage />;
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <PharmacyShell>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/categories" component={CategoriesPage} />
          <Route path="/pos">{["Owner", "Manager", "Pharmacist", "Cashier"].includes(user.role) ? <PosPage /> : <AccessDenied />}</Route>
          <Route path="/supply-chain">{["Owner", "Manager", "Inventory"].includes(user.role) ? <SupplyChainPage /> : <AccessDenied />}</Route>
          <Route path="/inventory-control">{["Owner", "Manager", "Pharmacist", "Inventory"].includes(user.role) ? <InventoryControlPage /> : <AccessDenied />}</Route>
          <Route path="/administration">{["Owner", "Manager"].includes(user.role) ? <AdministrationPage /> : <AccessDenied />}</Route>
          <Route path="/orders" component={OrdersPage} />
          <Route path="/sales" component={SalesPage} />
          <Route path="/customers" component={CustomersPage} />
          <Route path="/payments">{["Owner", "Manager", "Cashier", "Accountant"].includes(user.role) ? <PaymentsPage /> : <AccessDenied />}</Route>
          <Route path="/reports" component={ReportsPage} />
          <Route path="/settings">{["Owner", "Manager"].includes(user.role) ? <SettingsPage /> : <AccessDenied />}</Route>
          <Route path="/profile" component={ProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </PharmacyShell>
    </RoutedErrorBoundary>
  );
}

function AccessDenied() {
  return (
    <div className="grid min-h-[55vh] place-items-center rounded-[28px] border border-border bg-white/60 p-8 text-center">
      <div>
        <p className="text-4xl">🔒</p>
        <h2 className="mt-4 text-2xl font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your account role does not have permission to open this module.</p>
      </div>
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;
