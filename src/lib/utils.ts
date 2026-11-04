import type { Transaction, TransactionType } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function totalByType(txs: Transaction[], type: TransactionType): number {
  return txs
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export function netBalance(txs: Transaction[]): number {
  return totalByType(txs, 'income') - totalByType(txs, 'expense');
}

export interface MonthlyFlow {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export function monthlyCashFlow(txs: Transaction[], months = 6): MonthlyFlow[] {
  const now = new Date();
  const result: MonthlyFlow[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthTxs = txs.filter((t) => monthKey(t.date) === key);
    result.push({
      month: key,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      income: totalByType(monthTxs, 'income'),
      expense: totalByType(monthTxs, 'expense'),
    });
  }
  return result;
}

export function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
