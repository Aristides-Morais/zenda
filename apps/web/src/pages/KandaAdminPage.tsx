import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../components/PageHeader";
import { apiFetch } from "../lib/api";

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  total: number;
  status: string;
  createdAt: string;
};

type EcomProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

export default function KandaAdminPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<EcomProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado do Formulário de Novo Produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", price: "", stock: "0" });

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "orders") {
        const data = await apiFetch<Order[]>("/api/v1/ecom/orders");
        setOrders(data);
      } else {
        const data = await apiFetch<EcomProduct[]>("/api/v1/ecom/products");
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/ecom/products", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          price: Number(formData.price),
          stock: Number(formData.stock),
        }),
      });
      setIsModalOpen(false);
      setFormData({ name: "", description: "", price: "", stock: "0" });
      loadData();
    } catch (err) {
      alert("Erro ao criar produto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Kanda (Loja Online)"
        subtitle="Gestão do e-commerce"
        actions={
          activeTab === "products" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800"
            >
              + Novo Produto E-commerce
            </button>
          )
        }
      />

      <div className="p-8 max-w-5xl">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-zinc-200 mb-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "orders" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500"
            }`}
          >
            Pedidos Recebidos
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "products" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500"
            }`}
          >
            Produtos na Loja
          </button>
        </div>

        {loading ? (
          <div className="text-center text-sm text-zinc-500 py-10">A carregar...</div>
        ) : activeTab === "orders" ? (
          /* TABELA DE PEDIDOS */
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {orders.length === 0 ? (
              <div className="text-center text-sm text-zinc-500 py-10">Nenhum pedido recebido ainda.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Contacto</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">{new Date(o.createdAt).toLocaleDateString("pt-AO")}</td>
                      <td className="px-5 py-3 font-medium">{o.customerName}</td>
                      <td className="px-5 py-3 text-zinc-500">
                        {o.customerPhone}<br/>{o.customerAddress}
                      </td>
                      <td className="px-5 py-3 font-semibold">{o.total.toLocaleString("pt-AO")} Kz</td>
                      <td className="px-5 py-3">
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* TABELA DE PRODUTOS */
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {products.length === 0 ? (
              <div className="text-center text-sm text-zinc-500 py-10">Nenhum produto na loja online.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3">Produto</th>
                    <th className="px-5 py-3">Preço</th>
                    <th className="px-5 py-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium">{p.name}</td>
                      <td className="px-5 py-3">{p.price.toLocaleString("pt-AO")} Kz</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${p.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {p.stock} un.
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal de Novo Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Novo Produto para a Loja</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nome do Produto</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição (Opcional)</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Preço (Kz)</label>
                  <input type="number" required min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Stock Inicial</label>
                  <input type="number" required min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50">
                  {submitting ? "A guardar..." : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}