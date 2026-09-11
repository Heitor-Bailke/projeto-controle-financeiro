import { describe, expect, it } from 'vitest';
import { balanceSeries, expenseCategories, monthEntries, summarize } from './financial-metrics';
import { FinancialReportComponent } from './financial-report';
import { BalanceChartComponent } from './balance-chart';

describe('Financial calculations', () => {
  const entries = [
    { type: 'income', amount: '6500.00', date: '2026-09-04', status: 'settled' },
    { type: 'expense', amount: '67.98', date: '2026-09-04', status: 'settled', category: 'Delivery' },
    { type: 'expense', amount: '224.60', date: '2026-09-11', status: 'settled', category: 'Energia' },
    { type: 'expense', amount: '300.00', date: '2026-09-20', status: 'pending', category: 'Casa' },
    { type: 'income', amount: '100.00', date: '2026-09-25', status: 'pending' },
    { type: 'expense', amount: 999, date: '2026-08-31', status: 'settled' }
  ];
  it('reconciles actual, remaining and projected balances without counting pending income as available', () => {
    const month = monthEntries(entries, 9, 2026);
    expect(summarize(month)).toEqual({ income: 6500, expense: 292.58, pending: 300, receivable: 100,
      balance: 6207.42, remaining: 5907.42, projected: 6007.42, expenses: 592.58, count: 5 });
    expect(balanceSeries(month)).toEqual([{ label: '04', value: 6432.02 }, { label: '11', value: 6207.42 }]);
    expect(expenseCategories(month).reduce((sum, row) => sum + row.value, 0)).toBe(292.58);
    expect(expenseCategories(month, true).find(row => row.label === 'Casa')?.value).toBe(300);
  });
  it('preserves negative balances and reconciles cents across daily movements', () => {
    const month = [{ type: 'expense', amount: 0.1, date: '2026-09-01' },
      { type: 'expense', amount: 0.2, date: '2026-09-01' },
      { type: 'income', amount: 0.3, date: '2026-09-03' }];
    expect(balanceSeries(month)).toEqual([{ label: '01', value: -0.3 }, { label: '03', value: 0 }]);
    expect(summarize(month).balance).toBe(0);
    const chart = new BalanceChartComponent(); chart.rows = balanceSeries(month);
    expect(chart.y(-0.3)).toBeGreaterThan(chart.y(0));
    chart.rows = [{ label: '01', value: 0 }];
    expect(chart.points).toBe('300,120');
  });
  it('compares the same financial criteria and does not invent growth percentages without a positive base', () => {
    const report = new FinancialReportComponent();
    report.base = monthEntries(entries, 8, 2026); report.compared = monthEntries(entries, 9, 2026);
    expect(report.metrics.find(row => row.label === 'Despesas pagas')).toEqual({ label: 'Despesas pagas', base: 999, next: 292.58 });
    expect(report.variation(0, 100)).toBe('Sem base percentual');
    expect(report.variation(-100, 100)).toBe('Sem base percentual');
    expect(report.variation(100, 75)).toBe('-25%');
    expect(report.variation(0, 0)).toBe('—');
    expect(monthEntries(entries, 9, 2025)).toEqual([]);
  });
});
