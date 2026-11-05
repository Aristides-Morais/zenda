import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/produtos", label: "Produtos" },
  { to: "/clientes", label: "Clientes" },
  { to: "/vendas", label: "Vendas" },
  { to: "/despesas", label: "Despesas" },
  { to: "/faturacao", label: "Faturação" },
  { to: "/kanda", label: "Loja Kanda" }, // <-- NOVO
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Header Mobile */}
      <div className="md:hidden bg-white border-b border-zinc-200 px-4 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
            Z
          </div>
          <span className="font-semibold text-zinc-900">Zenda</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Overlay para fechar o menu no mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-300
        md:static md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-zinc-200">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
            Z
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-zinc-900 leading-tight">
              Zenda
            </div>
            <div className="text-xs text-zinc-500 truncate flex items-center gap-1">
              {business?.name ?? "—"}
              {business?.plan === "PRO" && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1 rounded">PRO</span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setIsMobileMenuOpen(false)}
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

      {/* Conteúdo Principal */}
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}