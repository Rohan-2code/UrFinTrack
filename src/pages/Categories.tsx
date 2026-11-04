import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Category, TransactionType } from '@/lib/types';

const COLOR_PRESETS = [
  '#10b981', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#6366f1', '#a855f7', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#64748b',
];

export function Categories() {
  const { categories, transactions, addCategory, updateCategory, deleteCategory } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setType('expense');
    setColor(COLOR_PRESETS[0]);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required.');
      return;
    }
    const dup = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === type && c.id !== editing?.id,
    );
    if (dup) {
      setError(`A ${type} category named "${trimmed}" already exists.`);
      return;
    }
    try {
      if (editing) {
        await updateCategory(editing.id, { name: trimmed, type, color });
      } else {
        await addCategory({ name: trimmed, type, color });
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const txCountForCategory = (catId: string) =>
    transactions.filter((t) => t.category_id === catId).length;

  const incomeCats = categories.filter((c) => c.type === 'income');
  const expenseCats = categories.filter((c) => c.type === 'expense');

  const renderGroup = (title: string, cats: Category[], Icon: typeof TrendingUp, accent: string) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${accent}`} />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
        <span className="text-xs text-slate-500">({cats.length})</span>
      </div>
      {cats.length === 0 ? (
        <p className="text-slate-500 text-sm py-6 text-center bg-slate-800/20 rounded-xl border border-slate-700/50">
          No {title.toLowerCase()} yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((cat) => (
            <div
              key={cat.id}
              className="group flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:border-slate-600 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.color + '22', border: `1px solid ${cat.color}55` }}
                >
                  <Tag className="w-4 h-4" style={{ color: cat.color }} />
                </span>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{cat.name}</p>
                  <p className="text-slate-500 text-xs">{txCountForCategory(cat.id)} transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700/40 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/40 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Categories</h2>
          <p className="text-sm text-slate-400">Manage your income and expense categories</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {renderGroup('Income', incomeCats, TrendingUp, 'text-emerald-400')}
      {renderGroup('Expense', expenseCats, TrendingDown, 'text-red-400')}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition text-xl leading-none">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Groceries"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition border ${
                      type === 'income'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" /> Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition border ${
                      type === 'expense'
                        ? 'bg-red-500/15 border-red-500 text-red-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" /> Expense
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition"
                >
                  {editing ? 'Save changes' : 'Add category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete category?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed. Transactions using this category will become "Uncategorized" but won't be deleted.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
