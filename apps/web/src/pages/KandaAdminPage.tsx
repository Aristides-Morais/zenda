import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../components/PageHeader";
import { apiFetch } from "../lib/api";
import { useAuth } from "../features/auth/AuthContext";

type OrderItem = { id: string; quantity: number; unitPrice: number; product: { name: string } };
type Order = { id: string; customerName: string; customerPhone: string; customerAddress: string; total: number; status: string; createdAt: string; items: OrderItem[] };
type EcomProduct = { id: string; name: string; price: number; stock: number };

export default function KandaAdminPage() {
  const { business } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<EcomProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", price: "", stock: "0" });

  if (business?.role === "EMPLOYEE") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center bg-red-50 p-6 rounded-xl border border-red-200 max-w-md">
          <h2 className="text-lg font-bold text-red-700 mb-2">Acesso Negado</h2>
          <p className="text-sm text-red-600">Não tem permissões de Gestor ou Dono para aceder à loja online.</p>
        </div>
      </div>
    );
  }

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

  useEffect(() => { loadData(); }, [activeTab]);

  async function handleUpdateStatus(orderId: string, newStatus: string) {
    try {
      await apiFetch(`/api/v1/ecom/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      alert("Erro ao atualizar o estado do pedido.");
    }
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
      case "PAID": return "bg-blue-100 text-blue-700 border-blue-200";
      case "SHIPPED": return "bg-purple-100 text-purple-700 border-purple-200";
      case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <>
      <PageHeader
        title="Kanda (Loja Online)"
        subtitle="Gestão do e-commerce"
        actions={
          activeTab === "products" && (
            <button onClick={() => setIsModalOpen(true)} className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800">
              + Novo Produto E-commerce
            </button>
          )
        }
      />

      <div className="p-4 md:p-8 max-w-5xl">
        <div className="flex gap-4 border-b border-zinc-200 mb-6">
          <button onClick={() => setActiveTab("orders")} className={`pb-3 text-sm font-medium transition-colors ${activeTab === "orders" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500"}`}>Pedidos Recebidos</button>
          <button onClick={() => setActiveTab("products")} className={`pb-3 text-sm font-medium transition-colors ${activeTab === "products" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500"}`}>Produtos na Loja</button>
        </div>

        {loading ? (
          <div className="text-center text-sm text-zinc-500 py-10">A carregar...</div>
        ) : activeTab === "orders" ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
            {orders.length === 0 ? (
              <div className="text-center text-sm text-zinc-500 py-10">Nenhum pedido recebido ainda.</div>
            ) : (
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("pt-AO")}</td>
                      <td className="px-5 py-3 font-medium">
                        {o.customerName}
                        <span className="block text-xs text-zinc-500">{o.customerPhone}</span>
                      </td>
                      <td className="px-5 py-3 font-semibold whitespace-nowrap">{o.total.toLocaleString("pt-AO")} Kz</td>
                      <td className="px-5 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                          className={`text-xs font-bold rounded-lg px-2 py-1.5 border outline-none cursor-pointer appearance-none ${getStatusColor(o.status)}`}
                        >
                          <option value="PENDING">PENDENTE</option>
                          <option value="PAID">PAGO</option>
                          <option value="SHIPPED">ENVIADO</option>
                          <option value="DELIVERED">ENTREGUE</option>
                          <option value="CANCELLED">CANCELADO</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => setSelectedOrder(o)} className="text-zinc-600 hover:text-zinc-900 text-xs font-medium border border-zinc-300 px-3 py-1.5 rounded-lg">
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
            {products.length === 0 ? (
              <div className="text-center text-sm text-zinc-500 py-10">Nenhum produto na loja online.</div>
            ) : (
              <table className="w-full text-left text-sm min-w-[500px]">
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

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-zinc-900">Detalhes do Pedido</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-zinc-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-medium">Cliente</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
                <p className="text-sm text-zinc-600">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-medium">Endereço de Entrega</p>
                <p className="text-sm">{selectedOrder.customerAddress}</p>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-lg p-4 mb-6 border border-zinc-200">
              <p className="text-xs text-zinc-500 uppercase font-medium mb-3">Produtos</p>
              <ul className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-zinc-700">{item.quantity}x {item.product.name}</span>
                    <span className="font-medium">{(item.quantity * item.unitPrice).toLocaleString("pt-AO")} Kz</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-zinc-200 mt-3 pt-3 flex justify-between font-bold">
                <span>Total:</span>
                <span>{selectedOrder.total.toLocaleString("pt-AO")} Kz</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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