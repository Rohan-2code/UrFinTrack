import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Scale, Wallet } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { formatCurrency, monthlyCashFlow, totalByType, netBalance } from '@/lib/utils';

export function Dashboard() {
  const { transactions, categories, getCategoryName, getCategoryColor } = useData();

  const income = totalByType(transactions, 'income');
  const expense = totalByType(transactions, 'expense');
  const balance = netBalance(transactions);

  const flowData = useMemo(() => monthlyCashFlow(transactions, 6), [transactions]);

  const expenseBreakdown = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const key = t.category_id ?? 'uncategorized';
      byCat.set(key, (byCat.get(key) ?? 0) + Number(t.amount));
    }
    const arr = Array.from(byCat.entries()).map(([catId, amount]) => ({
      name: getCategoryName(catId === 'uncategorized' ? null : catId),
      value: amount,
      color: getCategoryColor(catId === 'uncategorized' ? null : catId),
    }));
    return arr.sort((a, b) => b.value - a.value);
  }, [transactions, getCategoryName, getCategoryColor]);

  const kpis = [
    {
      label: 'Total Income',
      value: formatCurrency(income),
      icon: TrendingUp,
      color: 'emerald',
      bg: 'from-emerald-500/10 to-emerald-500/5',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(expense),
      icon: TrendingDown,
      color: 'red',
      bg: 'from-red-500/10 to-red-500/5',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-400',
    },
    {
      label: 'Net Balance',
      value: formatCurrency(balance),
      icon: balance >= 0 ? Scale : Wallet,
      color: balance >= 0 ? 'sky' : 'amber',
      bg: balance >= 0 ? 'from-sky-500/10 to-sky-500/5' : 'from-amber-500/10 to-amber-500/5',
      border: balance >= 0 ? 'border-sky-500/20' : 'border-amber-500/20',
      iconBg: balance >= 0 ? 'bg-sky-500/15' : 'bg-amber-500/15',
      iconColor: balance >= 0 ? 'text-sky-400' : 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`relative overflow-hidden rounded-2xl border ${kpi.border} bg-gradient-to-br ${kpi.bg} bg-slate-800/40 p-6`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-white tracking-tight">{kpi.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash flow bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Monthly Cash Flow</h3>
          <p className="text-sm text-slate-400 mb-6">Income vs. expenses over the last 6 months</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flowData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={13} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={13} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
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
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense breakdown donut */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Expense Breakdown</h3>
          <p className="text-sm text-slate-400 mb-4">By category</p>
          {expenseBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
              No expense data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {expenseBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent transactions preview */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">
            No transactions yet. Click "Add Transaction" to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((t) => {
              const cat = categories.find((c) => c.id === t.category_id);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-700/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: getCategoryColor(t.category_id) }}
                    >
                      {getCategoryName(t.category_id).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{getCategoryName(t.category_id)}</p>
                      <p className="text-slate-500 text-xs">{t.notes || t.date}</p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(t.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
