import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../components/PageHeader";
import * as dashboardApi from "../features/dashboard/dashboard.api";
import type {
  LowStockProduct,
  SalesChartPoint,
  Summary,
  TopProduct,
} from "../features/dashboard/types";

function formatKz(value: number): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "green" | "red";
};

function KpiCard({ label, value, hint, accent = "default" }: KpiCardProps) {
  const valueColor =
    accent === "green"
      ? "text-emerald-600"
      : accent === "red"
      ? "text-red-600"
      : "text-zinc-900";

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
        {label}
      </div>
      <div className={`text-2xl font-semibold ${valueColor}`}>{value}</div>
      {hint && <div className="text-xs text-zinc-500 mt-1">{hint}</div>}
    </div>
  );
}

const BAR_COLORS = ["#18181b", "#27272a", "#3f3f46", "#52525b", "#71717a"];

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<SalesChartPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [s, c, t, l] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getSalesChart(30),
          dashboardApi.getTopProducts(5),
          dashboardApi.getLowStock(),
        ]);
        if (cancelled) return;
        setSummary(s);
        setChart(c);
        setTopProducts(t);
        setLowStock(l);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral do seu negócio" />

      <div className="p-8 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
            A carregar dados...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Vendas hoje"
                value={formatKz(summary?.todaySales ?? 0)}
                hint={`${summary?.todaySalesCount ?? 0} venda(s)`}
              />
              <KpiCard
                label="Vendas do mês"
                value={formatKz(summary?.monthSales ?? 0)}
              />
              <KpiCard
                label="Despesas do mês"
                value={formatKz(summary?.monthExpenses ?? 0)}
                accent="red"
              />
              <KpiCard
                label="Lucro estimado"
                value={formatKz(summary?.estimatedProfit ?? 0)}
                accent={(summary?.estimatedProfit ?? 0) >= 0 ? "green" : "red"}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-5">
                <div className="mb-4">
                  <h2 className="font-semibold text-zinc-900">
                    Vendas dos últimos 30 dias
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Receita diária</p>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart}>
                      <defs>
                        <linearGradient
                          id="salesFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#18181b"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="100%"
                            stopColor="#18181b"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDateShort}
                        tick={{ fontSize: 11, fill: "#71717a" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#71717a" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v as number) / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value) => formatKz(Number(value))}
                        labelFormatter={(label) =>
                          `Dia ${formatDateShort(String(label))}`
                        }
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid #e4e4e7",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#18181b"
                        strokeWidth={2}
                        fill="url(#salesFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <h2 className="font-semibold text-zinc-900 mb-4">Stock baixo</h2>
                {lowStock.length === 0 ? (
                  <div className="text-sm text-zinc-500 py-8 text-center">
                    Tudo em ordem ✅
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {lowStock.slice(0, 6).map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-zinc-700 truncate pr-2">
                          {p.name}
                        </span>
                        <span className="text-red-600 font-medium shrink-0">
                          {p.stock} / {p.minStock}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h2 className="font-semibold text-zinc-900 mb-4">
                Produtos mais vendidos
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ left: 40 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f4f4f5"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                      width={140}
                    />
                    <Tooltip
                      formatter={(v) => [`${v} un.`, "Quantidade"]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e4e4e7",
                      }}
                    />
                    <Bar dataKey="quantitySold" radius={[0, 6, 6, 0]}>
                      {topProducts.map((_, i) => (
                        <Cell
                          key={i}
                          fill={BAR_COLORS[i % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}