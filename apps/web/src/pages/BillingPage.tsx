import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { apiFetch } from "../lib/api";
import { useAuth } from "../features/auth/AuthContext";

export default function BillingPage() {
  const { business } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get("success") === "true";

  const currentPlan = business?.plan || "FREE";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/api/v1/billing/checkout", {
        method: "POST",
      });
      window.location.href = url; 
    } catch (err) {
      alert("Erro ao iniciar o pagamento.");
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Faturação" subtitle="Faça a gestão do seu plano" />
      
      <div className="p-8 max-w-4xl">
        {isSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            ✅ Pagamento concluído com sucesso! O seu plano foi atualizado.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano FREE */}
          <div className={`bg-white rounded-xl border p-6 ${currentPlan === "FREE" ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"}`}>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Plano Grátis</h3>
            <p className="text-3xl font-bold text-zinc-900 mb-4">0 Kz<span className="text-sm font-normal text-zinc-500">/mês</span></p>
            <ul className="space-y-2 text-sm text-zinc-600 mb-6">
              <li>✅ Até 50 produtos</li>
              <li>✅ 1 utilizador</li>
              <li>✅ Vendas ilimitadas</li>
              <li>✅ Gestão de despesas</li>
            </ul>
            {currentPlan === "FREE" && (
              <button disabled className="w-full py-2 bg-zinc-100 text-zinc-500 font-medium rounded-lg">
                Plano Atual
              </button>
            )}
          </div>

          {/* Plano PRO */}
          <div className={`bg-white rounded-xl border p-6 ${currentPlan === "PRO" ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-zinc-900">Plano PRO</h3>
              <span className="bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded">Recomendado</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900 mb-4">15.000 Kz<span className="text-sm font-normal text-zinc-500">/mês</span></p>
            <ul className="space-y-2 text-sm text-zinc-600 mb-6">
              <li>✅ Produtos ilimitados</li>
              <li>✅ Utilizadores ilimitados</li>
              <li>✅ Vendas ilimitadas</li>
              <li>✅ Gestão de despesas</li>
              <li>✅ Suporte prioritário</li>
            </ul>
            {currentPlan === "PRO" ? (
              <button disabled className="w-full py-2 bg-zinc-100 text-zinc-500 font-medium rounded-lg">
                Plano Atual
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "A redirecionar..." : "Fazer Upgrade"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}