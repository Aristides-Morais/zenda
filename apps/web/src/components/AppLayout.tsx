import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/produtos", label: "Produtos" },
  { to: "/clientes", label: "Clientes" },
  { to: "/vendas", label: "Vendas" },
  { to: "/despesas", label: "Despesas" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-zinc-200">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
            Z
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-zinc-900 leading-tight">
              Zenda
            </div>
            <div className="text-xs text-zinc-500 truncate">
              {business?.name ?? "—"}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-200">
          <div className="px-3 py-2">
            <div className="text-sm font-medium text-zinc-900 truncate">
              {user?.name}
            </div>
            <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}