import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Category, Transaction, TransactionType } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localCategories, localTransactions } from '@/lib/localStorage';
import { useAuth } from './AuthContext';

interface DataContextValue {
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  isLocalMode: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryName: (id: string | null) => string;
  getCategoryColor: (id: string | null) => string;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isLocalMode } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured || isLocalMode) {
      setCategories(localCategories.list(user.id));
      setTransactions(localTransactions.list(user.id));
      setLoading(false);
      return;
    }
    try {
      const [catsRes, txRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
      ]);
      setCategories((catsRes.data as Category[]) ?? []);
      setTransactions((txRes.data as Transaction[]) ?? []);
    } catch {
      setCategories([]);
      setTransactions([]);
    }
    setLoading(false);
  }, [user, isLocalMode]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return;
      if (!isSupabaseConfigured || isLocalMode) {
        const created = localTransactions.insert(user.id, tx);
        setTransactions((prev) => [created, ...prev]);
        return;
      }
      const { data, error } = await supabase
        .from('transactions')
        .insert(tx)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (data) setTransactions((prev) => [data as Transaction, ...prev]);
    },
    [user, isLocalMode],
  );

  const updateTransaction = useCallback(
    async (id: string, patch: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>) => {
      if (!user) return;
      if (!isSupabaseConfigured || isLocalMode) {
        localTransactions.update(id, patch);
        setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
        return;
      }
      const { error } = await supabase.from('transactions').update(patch).eq('id', id);
      if (error) throw new Error(error.message);
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [user, isLocalMode],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      if (!isSupabaseConfigured || isLocalMode) {
        localTransactions.remove(id);
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        return;
      }
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [user, isLocalMode],
  );

  const addCategory = useCallback(
    async (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return;
      if (!isSupabaseConfigured || isLocalMode) {
        const created = localCategories.insert(user.id, cat);
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return;
      }
      const { data, error } = await supabase
        .from('categories')
        .insert(cat)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (data) setCategories((prev) => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
    },
    [user, isLocalMode],
  );

  const updateCategory = useCallback(
    async (id: string, patch: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>) => {
      if (!user) return;
      if (!isSupabaseConfigured || isLocalMode) {
        localCategories.update(id, patch);
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)).sort((a, b) => a.name.localeCompare(b.name)),
        );
        return;
      }
      const { error } = await supabase.from('categories').update(patch).eq('id', id);
      if (error) throw new Error(error.message);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)).sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
    [user, isLocalMode],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!user) return;
      if (!isSupabaseConfigured || isLocalMode) {
        localCategories.remove(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setTransactions((prev) =>
          prev.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
        );
        return;
      }
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setTransactions((prev) =>
        prev.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
      );
    },
    [user, isLocalMode],
  );

  const getCategoryName = useCallback(
    (id: string | null) => {
      if (!id) return 'Uncategorized';
      return categories.find((c) => c.id === id)?.name ?? 'Uncategorized';
    },
    [categories],
  );

  const getCategoryColor = useCallback(
    (id: string | null) => {
      if (!id) return '#94a3b8';
      return categories.find((c) => c.id === id)?.color ?? '#94a3b8';
    },
    [categories],
  );

  return (
    <DataContext.Provider
      value={{
        transactions,
        categories,
        loading,
        isLocalMode,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryName,
        getCategoryColor,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export type { TransactionType };
