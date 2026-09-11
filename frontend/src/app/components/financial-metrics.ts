export interface FinancialEntry {
  type: string; amount: number | string; date: string; status?: string; category?: string; name?: string;
}
export function monthEntries(entries: FinancialEntry[], month: number, year: number): FinancialEntry[] {
  return entries.filter(e => String(e.date).slice(0, 7) === `${year}-${String(month).padStart(2, '0')}`);
}
// Sum in cents so cards, category totals and reports reconcile exactly.
export function total(entries: FinancialEntry[]): number {
  return entries.reduce((sum, e) => sum + Math.round(Number(e.amount) * 100), 0) / 100;
}
export function summarize(entries: FinancialEntry[]) {
  const income = total(entries.filter(e => e.type === 'income' && e.status !== 'pending'));
  const expense = total(entries.filter(e => e.type === 'expense' && e.status !== 'pending'));
  const pending = total(entries.filter(e => e.type === 'expense' && e.status === 'pending'));
  const receivable = total(entries.filter(e => e.type === 'income' && e.status === 'pending'));
  const balance = Math.round((income - expense) * 100) / 100;
  const remaining = Math.round((balance - pending) * 100) / 100;
  return { income, expense, pending, receivable, balance, remaining,
    expenses: Math.round((expense + pending) * 100) / 100,
    projected: Math.round((remaining + receivable) * 100) / 100, count: entries.length };
}
export function expenseCategories(entries: FinancialEntry[], includePending = false) {
  const grouped = new Map<string, FinancialEntry[]>();
  for (const e of entries.filter(e => e.type === 'expense' && (includePending || e.status !== 'pending'))) {
    const label = e.category || 'Sem categoria';
    grouped.set(label, [...(grouped.get(label) || []), e]);
  }
  return [...grouped].map(([label, items]) => ({ label, value: total(items) })).sort((a, b) => b.value - a.value);
}
export function balanceSeries(entries: FinancialEntry[]) {
  const settled = entries.filter(e => e.status !== 'pending');
  const days = [...new Set(settled.map(e => String(e.date).slice(8, 10)))].sort();
  let cents = 0;
  return days.map(label => {
    for (const e of settled.filter(e => String(e.date).slice(8, 10) === label)) {
      cents += Math.round(Number(e.amount) * 100) * (e.type === 'income' ? 1 : -1);
    }
    return { label, value: cents / 100 };
  });
}
