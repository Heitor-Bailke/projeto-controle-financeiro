import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-cards', imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="summary-grid" aria-label="Resumo do mês" [attr.aria-busy]="loading">
    <article class="card balance-card"><p>Saldo do mês</p><strong>{{ loading ? '…' : money(income - expense) }}</strong><small>Entradas menos saídas pagas</small></article>
    <article class="card"><p>Total gasto</p><strong>{{ loading ? '…' : money(expense) }}</strong><small>Despesas pagas</small></article>
    <article class="card"><p>Total recebido</p><strong>{{ loading ? '…' : money(income) }}</strong><small>Entradas recebidas</small></article>
    <article class="card"><p>Economia</p><strong>{{ loading ? '…' : money(income - expense) }}</strong><small>Resultado do mês</small></article>
    <article class="card mobile-pending"><p>Pendentes</p><strong>{{ loading ? '…' : money(pending) }}</strong><small>Despesas a pagar</small></article>
  </section>`,
  styles: [`.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.card p{color:var(--muted);font-size:12px;font-weight:600;margin:0 0 16px}.card strong{display:block;font-size:clamp(20px,2.2vw,30px);font-weight:650;letter-spacing:-.7px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.card small{display:block;font-size:11px;color:var(--muted);margin-top:12px}.balance-card{background:var(--navy);color:white;border-color:var(--navy)}.balance-card p,.balance-card small{color:#bdd9ed}.mobile-pending{display:none}@media(max-width:1000px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.summary-grid{gap:12px}.balance-card{grid-column:1/-1}.balance-card strong{font-size:30px}.mobile-pending{display:block}.card{padding:20px}.card strong{font-size:20px}}`]
})
export class SummaryCardsComponent {
  @Input() income = 0; @Input() expense = 0; @Input() pending = 0; @Input() loading = false;
  private currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  money(value: number): string { return this.currency.format(value); }
}
