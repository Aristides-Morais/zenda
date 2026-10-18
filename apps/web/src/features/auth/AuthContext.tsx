import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setAccessToken } from "../../lib/api";
import * as authApi from "./auth.api";
import type { Business, User } from "./types";

type AuthState = {
  user: User | null;
  business: Business | null;
  loading: boolean;
  register: (input: {
    name: string;
    email: string;
    password: string;
    businessName: string;
  }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        const me = await authApi.me();
        if (cancelled) return;
        setUser(me.user);
        const first = me.memberships[0];
        if (first) {
          setBusiness({ id: first.businessId, name: first.businessName });
        }
      } catch {
        // sem sessão válida, é normal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const register: AuthState["register"] = useCallback(async (input) => {
    const result = await authApi.register(input);
    setAccessToken(result.accessToken);
    setUser(result.user);
    setBusiness(result.business);
  }, []);

  const login: AuthState["login"] = useCallback(async (input) => {
    const result = await authApi.login(input);
    setAccessToken(result.accessToken);
    setUser(result.user);
    setBusiness(result.business);
  }, []);

  const logout: AuthState["logout"] = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setBusiness(null);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, business, loading, register, login, logout }),
    [user, business, loading, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}