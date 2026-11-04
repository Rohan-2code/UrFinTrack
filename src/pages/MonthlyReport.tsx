import { useMemo, useState } from 'react';
import { Download, TrendingUp, TrendingDown, Scale, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useData } from '@/context/DataContext';
import { formatCurrency, monthKey, monthLabel, toCSV, downloadCSV, totalByType } from '@/lib/utils';

export function MonthlyReport() {
  const { transactions, getCategoryName } = useData();

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(monthKey(t.date));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [transactions]);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selected, setSelected] = useState(
    availableMonths.includes(defaultMonth) ? defaultMonth : (availableMonths[0] ?? defaultMonth),
  );

  const monthTxs = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === selected),
    [transactions, selected],
  );

  const income = totalByType(monthTxs, 'income');
  const expense = totalByType(monthTxs, 'expense');
  const balance = income - expense;

  const categoryBreakdown = useMemo(() => {
    const byCat = new Map<string, { income: number; expense: number }>();
    for (const t of monthTxs) {
      const name = getCategoryName(t.category_id);
      const entry = byCat.get(name) ?? { income: 0, expense: 0 };
      if (t.type === 'income') entry.income += Number(t.amount);
      else entry.expense += Number(t.amount);
      byCat.set(name, entry);
    }
    return Array.from(byCat.entries())
      .map(([name, vals]) => ({ name, ...vals, net: vals.income - vals.expense }))
      .sort((a, b) => b.expense + b.income - (a.expense + a.income));
  }, [monthTxs, getCategoryName]);

  const handleExport = () => {
    const rows = monthTxs.map((t) => ({
      Date: t.date,
      Type: t.type,
      Category: getCategoryName(t.category_id),
      Amount: Number(t.amount).toFixed(2),
      Notes: t.notes,
    }));
    const csv = toCSV(rows);
    downloadCSV(`report-${selected}.csv`, csv);
  };

  const chartData = categoryBreakdown.map((c) => ({
    name: c.name,
    income: c.income,
    expense: c.expense,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Monthly Report</h2>
          <p className="text-sm text-slate-400">Detailed breakdown for a selected month</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition appearance-none"
            >
              {availableMonths.length === 0 && <option value={defaultMonth}>{monthLabel(defaultMonth)}</option>}
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={monthTxs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 bg-slate-800/40 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">Income</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5 bg-slate-800/40 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-slate-400">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(expense)}</p>
        </div>
        <div
          className={`rounded-2xl border bg-slate-800/40 p-5 ${
            balance >= 0 ? 'border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-500/5' : 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                balance >= 0 ? 'bg-sky-500/15' : 'bg-amber-500/15'
              }`}
            >
              <Scale className={`w-5 h-5 ${balance >= 0 ? 'text-sky-400' : 'text-amber-400'}`} />
            </div>
            <span className="text-sm text-slate-400">Net Balance</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* Category breakdown chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Category Breakdown</h3>
          <p className="text-sm text-slate-400 mb-6">Income and expenses by category for {monthLabel(selected)}</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={13} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={13} tickLine={false} axisLine={false} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(v) => formatCurrency(Number(v))}
                cursor={{ fill: '#33415533' }}
              />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={24} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[0, 6, 6, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category table */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Category Summary</h3>
        </div>
        {categoryBreakdown.length === 0 ? (
          <p className="text-slate-500 text-sm py-12 text-center">
            No transactions in {monthLabel(selected)}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium text-right">Income</th>
                  <th className="px-6 py-3 font-medium text-right">Expense</th>
                  <th className="px-6 py-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {categoryBreakdown.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-700/20 transition">
                    <td className="px-6 py-3.5 text-sm text-slate-200 font-medium">{c.name}</td>
                    <td className="px-6 py-3.5 text-sm text-emerald-400 text-right">
                      {c.income > 0 ? formatCurrency(c.income) : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-red-400 text-right">
                      {c.expense > 0 ? formatCurrency(c.expense) : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-white text-right font-semibold">
                      {formatCurrency(c.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700">
                  <td className="px-6 py-3.5 text-sm text-white font-bold">Total</td>
                  <td className="px-6 py-3.5 text-sm text-emerald-400 text-right font-bold">{formatCurrency(income)}</td>
                  <td className="px-6 py-3.5 text-sm text-red-400 text-right font-bold">{formatCurrency(expense)}</td>
                  <td className="px-6 py-3.5 text-sm text-white text-right font-bold">{formatCurrency(balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
