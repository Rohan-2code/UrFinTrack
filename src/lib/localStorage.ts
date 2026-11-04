import type { Category, Transaction } from './types';

const LS_USER_KEY = 'expense_tracker_local_user';
const LS_CATS_KEY = 'expense_tracker_local_categories';
const LS_TX_KEY = 'expense_tracker_local_transactions';

export interface LocalUser {
  id: string;
  email: string;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Salary', type: 'income', color: '#10b981' },
  { name: 'Freelance', type: 'income', color: '#22c55e' },
  { name: 'Investments', type: 'income', color: '#14b8a6' },
  { name: 'Food', type: 'expense', color: '#f97316' },
  { name: 'Rent', type: 'expense', color: '#ef4444' },
  { name: 'Entertainment', type: 'expense', color: '#a855f7' },
  { name: 'Bills', type: 'expense', color: '#0ea5e9' },
  { name: 'Transport', type: 'expense', color: '#eab308' },
  { name: 'Shopping', type: 'expense', color: '#ec4899' },
  { name: 'Health', type: 'expense', color: '#06b6d4' },
];

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const localAuth = {
  getCurrentUser(): LocalUser | null {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? (JSON.parse(raw) as LocalUser) : null;
    } catch {
      return null;
    }
  },
  signUp(email: string): LocalUser {
    const user: LocalUser = { id: genId(), email };
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    // seed default categories for the new local user
    const existing = localCategories.list(user.id);
    if (existing.length === 0) {
      const cats: Category[] = DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        id: genId(),
        user_id: user.id,
        created_at: new Date().toISOString(),
      }));
      localStorage.setItem(LS_CATS_KEY, JSON.stringify(cats));
    }
    return user;
  },
  signIn(email: string): LocalUser {
    const user: LocalUser = { id: genId(), email };
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    return user;
  },
  signOut(): void {
    localStorage.removeItem(LS_USER_KEY);
  },
};

export const localCategories = {
  list(userId: string): Category[] {
    try {
      const raw = localStorage.getItem(LS_CATS_KEY);
      const all: Category[] = raw ? JSON.parse(raw) : [];
      return all.filter((c) => c.user_id === userId);
    } catch {
      return [];
    }
  },
  insert(userId: string, cat: Omit<Category, 'id' | 'user_id' | 'created_at'>): Category {
    const all = this.all();
    const newCat: Category = {
      ...cat,
      id: genId(),
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    all.push(newCat);
    localStorage.setItem(LS_CATS_KEY, JSON.stringify(all));
    return newCat;
  },
  update(id: string, patch: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>): void {
    const all = this.all().map((c) => (c.id === id ? { ...c, ...patch } : c));
    localStorage.setItem(LS_CATS_KEY, JSON.stringify(all));
  },
  remove(id: string): void {
    const all = this.all().filter((c) => c.id !== id);
    localStorage.setItem(LS_CATS_KEY, JSON.stringify(all));
    // null out category_id on transactions
    const txs = localTransactions.all().map((t) =>
      t.category_id === id ? { ...t, category_id: null } : t,
    );
    localStorage.setItem(LS_TX_KEY, JSON.stringify(txs));
  },
  all(): Category[] {
    try {
      const raw = localStorage.getItem(LS_CATS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};

export const localTransactions = {
  list(userId: string): Transaction[] {
    try {
      const raw = localStorage.getItem(LS_TX_KEY);
      const all: Transaction[] = raw ? JSON.parse(raw) : [];
      return all
        .filter((t) => t.user_id === userId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    } catch {
      return [];
    }
  },
  all(): Transaction[] {
    try {
      const raw = localStorage.getItem(LS_TX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  insert(userId: string, tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>): Transaction {
    const all = this.all();
    const newTx: Transaction = {
      ...tx,
      id: genId(),
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    all.push(newTx);
    localStorage.setItem(LS_TX_KEY, JSON.stringify(all));
    return newTx;
  },
  update(id: string, patch: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>): void {
    const all = this.all().map((t) => (t.id === id ? { ...t, ...patch } : t));
    localStorage.setItem(LS_TX_KEY, JSON.stringify(all));
  },
  remove(id: string): void {
    const all = this.all().filter((t) => t.id !== id);
    localStorage.setItem(LS_TX_KEY, JSON.stringify(all));
  },
};
