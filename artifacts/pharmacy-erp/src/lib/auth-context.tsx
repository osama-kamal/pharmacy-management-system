import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  licenseNumber: string;
  verified: boolean;
};
type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  startDemo: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("pharmacy:session-expired", handleExpiredSession);

    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener(
        "pharmacy:session-expired",
        handleExpiredSession,
      );
    };
  }, []);
  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Could not sign in");
    setUser(data.user);
  };
  const startDemo = async () => {
    const started = await fetch("/api/demo/start", { method: "POST" });
    if (!started.ok) {
      const data = await started.json().catch(() => ({}));
      throw new Error(data.error ?? "The demo could not be started");
    }
    const me = await fetch("/api/auth/me").then((response) => response.json());
    if (!me.user) throw new Error("The demo could not be started");
    setUser(me.user);
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, startDemo, updateUser: setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
