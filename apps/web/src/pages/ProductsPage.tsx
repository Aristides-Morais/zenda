import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../components/PageHeader";
import * as productsApi from "../features/products/products.api";
import type { Product } from "../features/products/types";

function formatKz(value: number): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pesquisa e paginação
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal (Criar e Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    cost: "",
    stock: "0",
    minStock: "5",
  });

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await productsApi.listProducts({ q: search, page, limit: 10 });
      setProducts(res.data);
      setTotalPages(res.meta.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  // Abrir Modal para Criar
  function handleOpenCreate() {
    setEditingProduct(null);
    setFormData({ name: "", sku: "", price: "", cost: "", stock: "0", minStock: "5" });
    setIsModalOpen(true);
  }

  // Abrir Modal para Editar
  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
    });
    setIsModalOpen(true);
  }

  // Submeter (Criar ou Editar)
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku || undefined,
        price: Number(formData.price),
        cost: Number(formData.cost),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
      };

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, payload);
      } else {
        await productsApi.createProduct(payload);
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSubmitting(false);
    }
  }

  // Apagar Produto
  async function handleDelete(id: string) {
    if (!window.confirm("Tem a certeza que quer apagar este produto?")) return;
    try {
      await productsApi.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert("Erro ao apagar produto");
    }
  }

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Gestão do catálogo e stock"
        actions={
          <button
            onClick={handleOpenCreate}
            className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            + Novo Produto
          </button>
        }
      />

      <div className="p-8">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {/* Barra de Pesquisa */}
          <div className="p-4 border-b border-zinc-200">
            <input
              type="text"
              placeholder="Pesquisar por nome ou SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full max-w-md rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">A carregar...</div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-500">{error}</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              Nenhum produto encontrado.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Preço</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{p.name}</td>
                    <td className="px-5 py-3 text-zinc-500">{p.sku || "—"}</td>
                    <td className="px-5 py-3 text-zinc-900">{formatKz(p.price)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          p.stock <= p.minStock
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {p.stock} un.
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="text-zinc-500 hover:text-zinc-900 text-sm font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Apagar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginação */}
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

      {/* Modal (Criar / Editar) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">SKU (Opcional)</label>
                <input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Preço (Kz)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Custo (Kz)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}