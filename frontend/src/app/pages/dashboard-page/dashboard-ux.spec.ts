import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { DashboardPageComponent } from './dashboard-page';
import { FinanceService } from '../../services/finance.service';

function setup() {
  const service = { getTransactions: vi.fn(() => EMPTY), getCategories: () => EMPTY, createTransaction: vi.fn(() => EMPTY), updateTransaction: vi.fn(() => EMPTY) };
  TestBed.configureTestingModule({ providers: [{ provide: FinanceService, useValue: service }, { provide: Router, useValue: {} }] });
  const fixture = TestBed.createComponent(DashboardPageComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component, service };
}

describe('Experiência do painel HB Tech', () => {
  it('separa totais mensais, pendências e filtros sem misturar períodos', () => {
    const { component } = setup();
    component.currentMonth = 9; component.currentYear = 2026;
    component.transactions = [
      { id: '1', type: 'income', amount: 1000, date: '2026-09-01', status: 'settled' },
      { id: '2', type: 'expense', amount: 100, date: '2026-09-02', status: 'settled', category: 'Casa' },
      { id: '3', type: 'expense', amount: 200, date: '2026-09-03', status: 'pending' },
      { id: '4', type: 'expense', amount: 400, date: '2026-08-01', status: 'settled' }
    ];
    expect(component.monthIncome).toBe(1000); expect(component.monthExpense).toBe(100); expect(component.monthPending).toBe(200);
    component.transactionFilter = 'pending'; expect(component.filteredTransactions.map(item => item.id)).toEqual(['3']);
    expect(component.categoryBars).toEqual([{ label: 'Casa', value: 100 }]);
    component.transactionFilter = 'expense'; expect(component.filteredTransactions).toHaveLength(3);
  });

  it('não cria lançamento antes de abrir os detalhes nem antes de revisar o OCR', () => {
    const { component, service } = setup();
    component.categories = [{ name: 'Casa', type: 'expense' }];
    component.expenseForm.patchValue({ name: 'Conta', amount: 50, category: 'Casa' });
    component.submitExpense();
    expect(component.showDetails).toBe(true); expect(service.createTransaction).not.toHaveBeenCalled();
    component.ocrNeedsReview = true;
    component.submitExpense();
    expect(component.statusError).toBe(true); expect(service.createTransaction).not.toHaveBeenCalled();
    component.ocrReviewed = true;
    component.submitExpense(); expect(service.createTransaction).toHaveBeenCalledOnce();
  });

  it('preserva categoria histórica durante edição', () => {
    const { component, service } = setup();
    component.editingId = 'existing'; component.showDetails = true;
    component.categories = [{ name: 'Nova', type: 'expense' }];
    component.expenseForm.patchValue({ name: 'Conta', amount: 50, category: 'Antiga' });
    component.submitExpense();
    expect(service.updateTransaction).toHaveBeenCalledWith('existing', expect.objectContaining({ category: 'Antiga' }));
    expect(service.createTransaction).not.toHaveBeenCalled();
  });

  it('mostra falha de carregamento sem exibir zero como resultado válido', () => {
    const { component, service, fixture } = setup();
    service.getTransactions.mockReturnValue(throwError(() => new Error('offline')));
    component.loadData(); fixture.detectChanges();
    expect(component.loading).toBe(false); expect(component.loadError).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-summary-cards')).toBeNull();
  });

  it('trata comparação com base zero e ano inválido', () => {
    const { component } = setup();
    component.baseYear = 2026; component.comparisonYear = 2026;
    expect(component.comparisonChange).toContain('Sem despesas');
    component.baseYear = 0;
    expect(component.comparisonValid).toBe(false); expect(component.comparisonBars).toEqual([]);
  });

  it('alinha o percentual e o texto ao segundo mês comparado com o primeiro', () => {
    const { component } = setup();
    component.baseMonth = 8; component.baseYear = 2026;
    component.comparisonMonth = 9; component.comparisonYear = 2026;
    component.transactions = [
      { type: 'expense', amount: 100, date: '2026-08-01' },
      { type: 'expense', amount: 75, date: '2026-09-01' }
    ];
    expect(component.comparisonChange).toContain('-25%');
    expect(component.getComparisonSummary()).toContain('Setembro/2026 teve');
    expect(component.getComparisonSummary()).toContain('a menos');
    component.baseMonth = 9; component.comparisonMonth = 8;
    expect(component.comparisonChange).toContain('33,3%');
    expect(component.getComparisonSummary()).toContain('Agosto/2026 teve');
    expect(component.getComparisonSummary()).toContain('a mais');
  });
});
