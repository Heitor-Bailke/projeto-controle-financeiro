import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY, of, Subject, throwError } from 'rxjs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { DashboardPageComponent } from './dashboard-page';
import { FinanceService } from '../../services/finance.service';

describe('Cadastro de categorias', () => {
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

  function setup(response: any) {
    vi.useFakeTimers();
    const service = { createCategory: vi.fn(() => response),
      getDashboard: () => EMPTY, getTransactions: () => EMPTY, getCategories: () => EMPTY };
    TestBed.configureTestingModule({ providers: [
      { provide: FinanceService, useValue: service },
      { provide: Router, useValue: {} }
    ] });
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openEntry();
    component.categoryForm.patchValue({ name: ' Mercado ', type: 'expense' });
    return { component, service, fixture };
  }

  it('adiciona o retorno do servidor à lista e ao seletor do lançamento', () => {
    const category = { id: 'cat-test', name: 'Mercado', type: 'expense' };
    const { component, service } = setup(of(category));
    component.submitCategory();
    expect(service.createCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mercado' }));
    expect(component.categories).toEqual([category]);
    expect(component.expenseForm.value.category).toBe('Mercado');
    expect(component.categoryStatusMessage).toContain('sucesso');
    expect(component.categoryForm.value.name).toBe('');
  });

  it('mostra sessão expirada e preserva o nome para não perder a tentativa', () => {
    const { component, fixture } = setup(throwError(() => ({ status: 401 })));
    component.submitCategory();
    expect(component.categorySessionExpired).toBe(true);
    expect(component.savingCategory).toBe(false);
    expect(component.categoryForm.value.name).toBe('Mercado');
    expect(fixture.nativeElement.textContent).toContain('Entrar novamente');
  });

  it('mostra falhas de conexão e permite tentar novamente', () => {
    const { component } = setup(throwError(() => ({ status: 0 })));
    component.submitCategory();
    expect(component.categoryStatusMessage).toContain('porta 3000');
    expect(component.savingCategory).toBe(false);
  });

  it('impede envios duplicados enquanto aguarda o servidor', () => {
    const { component, service } = setup(new Subject());
    component.submitCategory();
    component.submitCategory();
    expect(service.createCategory).toHaveBeenCalledTimes(1);
  });
});
