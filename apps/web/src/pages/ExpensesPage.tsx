import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../components/PageHeader";
import * as expensesApi from "../features/expenses/expense.api";
import type { Expense } from "../features/expenses/types";

function formatKz(value: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(value);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // NOVO: Estado para o modal de apagar
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Renda",
    date: new Date().toISOString().split("T")[0],
  });

  async function loadExpenses() {
    setLoading(true);
    try {
      const res = await expensesApi.listExpenses({ q: search, page, limit: 10 });
      setExpenses(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { loadExpenses(); }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  function handleOpenCreate() {
    setEditingExpense(null);
    setFormData({
      description: "",
      amount: "",
      category: "Renda",
      date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(expense: Expense) {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date.split("T")[0],
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
      };

      if (editingExpense) {
        await expensesApi.updateExpense(editingExpense.id, payload);
      } else {
        await expensesApi.createExpense(payload);
      }
      setIsModalOpen(false);
      loadExpenses();
    } catch (err) {
      alert("Erro ao guardar despesa");
    } finally {
      setSubmitting(false);
    }
  }

  // NOVO: Função de apagar real
  async function confirmDelete() {
    if (!expenseToDelete) return;
    try {
      await expensesApi.deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      loadExpenses();
    } catch (err) {
      alert("Erro ao apagar despesa");
    }
  }

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle="Gestão de custos operacionais"
        actions={
          <button onClick={handleOpenCreate} className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800">
            + Nova Despesa
          </button>
        }
      />

      <div className="p-8">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="p-4 border-b border-zinc-200">
            <input
              type="text"
              placeholder="Pesquisar despesa..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full max-w-md rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">A carregar...</div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">Nenhuma despesa encontrada.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium text-right">Valor</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-600">{new Date(e.date).toLocaleDateString("pt-AO")}</td>
                    <td className="px-5 py-3 font-medium text-zinc-900">{e.description}</td>
                    <td className="px-5 py-3 text-zinc-600">{e.category}</td>
                    <td className="px-5 py-3 text-right font-semibold text-red-600">{formatKz(e.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleOpenEdit(e)} className="text-zinc-500 hover:text-zinc-900 font-medium">Editar</button>
                        <button onClick={() => setExpenseToDelete(e)} className="text-red-500 hover:text-red-700 font-medium">Apagar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="px-5 py-3 border-t border-zinc-200 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-zinc-300 rounded-md disabled:opacity-50">Anterior</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-zinc-300 rounded-md disabled:opacity-50">Próxima</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">{editingExpense ? "Editar Despesa" : "Nova Despesa"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label>
                <input required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Valor (Kz)</label>
                  <input type="number" required min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Data</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Categoria</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900">
                  <option value="Renda">Renda</option>
                  <option value="Salários">Salários</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Água e Luz">Água e Luz</option>
                  <option value="Fornecedor">Fornecedor</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50">{submitting ? "A guardar..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOVO: Modal de Confirmação de Apagar */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Apagar Despesa</h3>
            <p className="text-sm text-zinc-500 mb-6">Tem a certeza que deseja apagar a despesa <strong>{expenseToDelete.description}</strong>?</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setExpenseToDelete(null)} className="flex-1 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Sim, apagar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}