import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../components/PageHeader";
import * as salesApi from "../features/sales/sale.api";
import * as productsApi from "../features/products/products.api";
import * as customersApi from "../features/customers/customer.api";
import type { Sale } from "../features/sales/types";
import type { Product } from "../features/products/types";
import type { Customer } from "../features/customers/types";

function formatKz(value: number): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

type CartItem = {
  product: Product;
  quantity: number;
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados do Modal (Nova Venda)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  async function loadSales() {
    setLoading(true);
    try {
      const res = await salesApi.listSales({ page, limit: 10 });
      setSales(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, [page]);

  async function openModal() {
    setIsModalOpen(true);
    setErrorMsg(null);
    setCart([]);
    setSelectedCustomerId("");
    setSelectedProductId("");
    setQuantityToAdd(1);
    
    // Carrega clientes e produtos para os seletores
    try {
      const [cRes, pRes] = await Promise.all([
        customersApi.listCustomers({ limit: 100 }),
        productsApi.listProducts({ limit: 100 }),
      ]);
      setCustomers(cRes.data);
      setProducts(pRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados para a venda", err);
    }
  }

  function handleAddToCart() {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (quantityToAdd > product.stock) {
      setErrorMsg(`Stock insuficiente. Apenas ${product.stock} disponíveis.`);
      return;
    }

    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity + quantityToAdd > product.stock) {
        setErrorMsg(`Stock insuficiente. Apenas ${product.stock} disponíveis.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: quantityToAdd }]);
    }

    setSelectedProductId("");
    setQuantityToAdd(1);
    setErrorMsg(null);
  }

  function handleRemoveFromCart(id: string) {
    setCart(cart.filter((item) => item.product.id !== id));
  }

  const cartTotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  async function handleSubmitSale(e: FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMsg("Adicione pelo menos um produto à venda.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await salesApi.createSale({
        customerId: selectedCustomerId || undefined,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        })),
      });
      setIsModalOpen(false);
      loadSales();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao registar venda");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle="Histórico de transações"
        actions={
          <button
            onClick={openModal}
            className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            + Nova Venda
          </button>
        }
      />

      <div className="p-8">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">A carregar...</div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              Nenhuma venda registada.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Vendedor</th>
                  <th className="px-5 py-3 font-medium text-center">Itens</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-600">
                      {new Date(s.createdAt).toLocaleDateString("pt-AO")}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-900">
                      {s.customer?.name || "Consumidor Final"}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{s.user?.name}</td>
                    <td className="px-5 py-3 text-center text-zinc-600">
                      {s._count?.items || 0}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-zinc-900">
                      {formatKz(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="px-5 py-3 border-t border-zinc-200 flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-zinc-300 rounded-md disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-zinc-300 rounded-md disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nova Venda */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Registar Venda</h2>
            
            {errorMsg && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 p-3 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitSale}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Cliente (Opcional)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Consumidor Final</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Produto</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="">Selecione um produto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {formatKz(p.price)} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Qtd</label>
                    <input
                      type="number"
                      min="1"
                      value={quantityToAdd}
                      onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {cart.length > 0 && (
                <table className="w-full text-sm mb-4">
                  <thead className="text-zinc-500 text-xs uppercase">
                    <tr className="border-b border-zinc-200">
                      <th className="text-left py-2">Produto</th>
                      <th className="text-center py-2">Qtd</th>
                      <th className="text-right py-2">Subtotal</th>
                      <th className="text-right py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.product.id} className="border-b border-zinc-100">
                        <td className="py-2 text-zinc-900">{item.product.name}</td>
                        <td className="py-2 text-center text-zinc-600">{item.quantity}</td>
                        <td className="py-2 text-right font-medium">
                          {formatKz(item.product.price * item.quantity)}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="text-red-500 text-xs hover:underline"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
                <div className="text-lg font-semibold text-zinc-900">
                  Total: {formatKz(cartTotal)}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || cart.length === 0}
                    className="px-6 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submitting ? "A processar..." : "Finalizar Venda"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}