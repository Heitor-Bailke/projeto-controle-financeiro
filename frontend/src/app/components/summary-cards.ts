import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-summary-cards', imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="summary-grid" aria-label="Resumo financeiro do mês" [attr.aria-busy]="loading">
    <article class="card balance-card"><p>Saldo atual do mês</p><strong>{{ display(income - expense) }}</strong><small>Recebido menos despesas pagas</small></article>
    <article class="card" [class.negative]="income - expense - pending < 0"><p>Saldo restante</p><strong>{{ display(income - expense - pending) }}</strong><small>Saldo atual menos contas a pagar</small></article>
    <article class="card"><p>Total em despesas</p><strong>{{ display(expense + pending) }}</strong><small>Todos os gastos lançados no mês</small></article>
    <article class="card income-card"><p>Receitas recebidas</p><strong>{{ display(income) }}</strong><small>A receber: {{ display(receivable) }}</small></article>
    <article class="card expense-card"><p>Gastos pagos</p><strong>{{ display(expense) }}</strong><small>Saídas já confirmadas</small></article>
    <article class="card pending-card"><p>Contas a pagar</p><strong>{{ display(pending) }}</strong><small>Despesas pendentes do mês</small></article>
  </section>`,
  styles: [`.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card{border-top:3px solid var(--electric);min-width:0;padding:22px}.card p{color:var(--muted);font-size:12px;font-weight:650;margin:0 0 12px}.card strong{display:block;font-size:clamp(20px,2vw,28px);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.card small{display:block;font-size:11px;color:var(--muted);margin-top:10px}.balance-card{background:var(--navy);color:white}.balance-card p,.balance-card small{color:#bdd9ed}.income-card{border-top-color:var(--success)}.expense-card,.negative{border-top-color:var(--danger)}.negative strong{color:var(--danger)}.pending-card{border-top-color:#d49a27}@media(max-width:1100px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.summary-grid{grid-template-columns:1fr}}`]
})
export class SummaryCardsComponent {
  @Input() income = 0; @Input() expense = 0; @Input() pending = 0;
  @Input() receivable = 0; @Input() loading = false;
  private currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  display(value: number): string { return this.loading ? '…' : this.currency.format(value); }
}
