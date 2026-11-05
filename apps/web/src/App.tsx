import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";
import SalesPage from "./pages/SalesPage";
import ExpensesPage from "./pages/ExpensesPage";
import BillingPage from "./pages/BillingPage";
import KandaAdminPage from "./pages/KandaAdminPage"; // <-- NOVO

function Protected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          
          <Route path="/" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/produtos" element={<Protected><ProductsPage /></Protected>} />
          <Route path="/clientes" element={<Protected><CustomersPage /></Protected>} />
          <Route path="/vendas" element={<Protected><SalesPage /></Protected>} />
          <Route path="/despesas" element={<Protected><ExpensesPage /></Protected>} />
          <Route path="/faturacao" element={<Protected><BillingPage /></Protected>} />
          
          {/* Rota do Kanda */}
          <Route path="/kanda" element={<Protected><KandaAdminPage /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}