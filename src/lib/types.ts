export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  date: string; // ISO date string YYYY-MM-DD
  notes: string;
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category?: Category | null;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string | undefined;
}
