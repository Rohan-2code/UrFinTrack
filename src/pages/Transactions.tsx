import { useMemo, useState } from 'react';
import { Search, Pencil, Trash2, Plus, Filter } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { TransactionModal } from '@/components/TransactionModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Transaction, TransactionType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

type FilterType = 'all' | TransactionType;

export function Transactions() {
  const { transactions, categories, getCategoryName, getCategoryColor, addTransaction, updateTransaction, deleteTransaction } =
    useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const catName = getCategoryName(t.category_id).toLowerCase();
        if (!catName.includes(q) && !t.notes.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, fromDate, toDate, search, getCategoryName]);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditing(tx);
    setModalOpen(true);
  };

  const handleSubmit = async (data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (editing) {
      await updateTransaction(editing.id, data);
    } else {
      await addTransaction(data);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Transactions</h2>
          <p className="text-sm text-slate-400">{filtered.length} of {transactions.length} transactions</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes or category..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        {(search || typeFilter !== 'all' || fromDate || toDate) && (
          <button
            onClick={() => {
              setSearch('');
              setTypeFilter('all');
              setFromDate('');
              setToDate('');
            }}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 mb-1">No transactions found</p>
            <p className="text-slate-500 text-sm">
              {transactions.length === 0 ? 'Add your first transaction to get started.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-700/20 transition">
                    <td className="px-5 py-3.5 text-sm text-slate-300 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(t.category_id) }}
                        >
                          {getCategoryName(t.category_id).charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-200">{getCategoryName(t.category_id)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 max-w-[200px] truncate">
                      {t.notes || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          t.type === 'income'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {t.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3.5 text-sm font-semibold text-right whitespace-nowrap ${
                        t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(t.amount))}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/40 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(t.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        editing={editing}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete transaction?"
        message="This transaction will be permanently removed. This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
