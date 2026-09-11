import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancialEntry, expenseCategories, summarize } from './financial-metrics';

@Component({
  selector: 'app-financial-report', imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section aria-label="Relatório financeiro detalhado">
    <p class="helper-text">Comparação pela data de cada lançamento. Meses em andamento são parciais; meses futuros contêm apenas os valores já registrados.</p>
    <p class="status info" *ngIf="!base.length || !compared.length">{{ !base.length ? baseLabel : comparedLabel }} não tem lançamentos. Zero indica ausência de registros, não comprova ausência de movimentação.</p>
    <div class="periods">
      <article *ngFor="let period of periods"><h3>{{ period.label }}</h3><small>{{ period.summary.count }} lançamentos</small>
        <div class="metric"><span>Recebido</span><strong>{{ money(period.summary.income) }}</strong></div><div class="track"><i [style.width.%]="width(period.summary.income)" class="income"></i></div>
        <div class="metric"><span>Pago</span><strong>{{ money(period.summary.expense) }}</strong></div><div class="track"><i [style.width.%]="width(period.summary.expense)" class="expense"></i></div>
        <div class="metric"><span>A pagar</span><strong>{{ money(period.summary.pending) }}</strong></div><div class="track"><i [style.width.%]="width(period.summary.pending)" class="pending"></i></div>
        <p class="balance" [class.negative]="period.summary.balance < 0">Resultado realizado <strong>{{ money(period.summary.balance) }}</strong></p>
      </article>
    </div>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Comparação dos indicadores financeiros"><table>
      <caption>Indicadores e variação do segundo período em relação ao primeiro</caption>
      <thead><tr><th scope="col">Indicador</th><th scope="col">{{ baseLabel }}</th><th scope="col">{{ comparedLabel }}</th><th scope="col">Diferença (R$)</th><th scope="col">Variação</th></tr></thead>
      <tbody><tr *ngFor="let row of metrics"><th scope="row">{{ row.label }}</th><td>{{ money(row.base) }}</td><td>{{ money(row.next) }}</td><td>{{ money(row.next - row.base) }}</td><td>{{ variation(row.base, row.next) }}</td></tr></tbody>
    </table></div>
    <p class="helper-text">Resultado realizado = recebido − pago. Saldo restante = resultado − contas a pagar. Saldo previsto = restante + valores a receber. Valores previstos dependem da confirmação dos pagamentos e recebimentos.</p>
    <div class="table-wrap" *ngIf="categories.length" tabindex="0" role="region" aria-label="Despesas por categoria"><table>
      <caption>Onde os gastos mudaram · despesas pagas e pendentes</caption>
      <thead><tr><th scope="col">Categoria</th><th scope="col">{{ baseLabel }}</th><th scope="col">{{ comparedLabel }}</th><th scope="col">Diferença (R$)</th></tr></thead>
      <tbody><tr *ngFor="let row of categories"><th scope="row">{{ row.label }}</th><td>{{ money(row.base) }}</td><td>{{ money(row.next) }}</td><td>{{ money(row.next - row.base) }}</td></tr></tbody>
    </table></div>
  </section>`,
  styles: [`section{margin-top:24px}.periods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:24px 0}.periods article{padding:24px;background:var(--canvas);border:1px solid var(--border);border-radius:12px;min-width:0}h3{margin-bottom:2px}small{color:var(--muted)}.metric{display:flex;justify-content:space-between;gap:10px;margin:18px 0 6px;font-size:12px}.track{height:9px;background:var(--border);border-radius:8px;overflow:hidden}.track i{display:block;height:100%;border-radius:8px}.income{background:#20a36a}.expense{background:var(--electric)}.pending{background:#d49a27}.balance{border-top:1px solid var(--border);padding-top:18px;margin:22px 0 0;font-size:12px}.balance strong{display:block;font-size:24px}.negative{color:var(--danger)}.table-wrap{overflow:auto;margin:24px 0}table{border-collapse:collapse;width:100%;font-size:12px}caption{text-align:left;font-weight:650;font-size:14px;margin-bottom:16px}th,td{padding:14px 12px;border-bottom:1px solid var(--border);text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}th:first-child{text-align:left}thead{background:var(--canvas)}tbody th{font-weight:500}@media(max-width:600px){.periods{grid-template-columns:1fr}}`]
})
export class FinancialReportComponent {
  @Input() base: FinancialEntry[] = []; @Input() compared: FinancialEntry[] = [];
  @Input() baseLabel = ''; @Input() comparedLabel = '';
  get periods() { return [{ label: this.baseLabel, summary: summarize(this.base) }, { label: this.comparedLabel, summary: summarize(this.compared) }]; }
  get metrics() {
    const a = summarize(this.base), b = summarize(this.compared);
    const labels = { income: 'Receitas recebidas', expense: 'Despesas pagas', pending: 'Contas a pagar', receivable: 'Valores a receber', expenses: 'Total em despesas', balance: 'Resultado realizado', remaining: 'Saldo restante', projected: 'Saldo previsto' };
    return (Object.keys(labels) as (keyof typeof labels)[]).map(key => ({ label: labels[key], base: a[key], next: b[key] }));
  }
  get categories() {
    const a = expenseCategories(this.base, true), b = expenseCategories(this.compared, true);
    return [...new Set([...a, ...b].map(r => r.label))].map(label => ({ label, base: a.find(r => r.label === label)?.value || 0, next: b.find(r => r.label === label)?.value || 0 })).sort((a, b) => Math.abs(b.next - b.base) - Math.abs(a.next - a.base));
  }
  width(value: number) { const max = Math.max(0, ...this.periods.flatMap(p => [p.summary.income, p.summary.expense, p.summary.pending])); return max ? value / max * 100 : 0; }
  variation(base: number, next: number) {
    if (base <= 0) return base === 0 && next === 0 ? '—' : 'Sem base percentual';
    return `${((next - base) / base * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
  money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
}
