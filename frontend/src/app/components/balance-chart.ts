import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartBar } from './bar-chart';
@Component({
  selector: 'app-balance-chart', imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<figure aria-label="Evolução do saldo realizado no mês">
    <p class="muted" *ngIf="!rows.length">Nenhuma movimentação paga ou recebida neste mês.</p>
    <ng-container *ngIf="rows.length">
      <div class="scale"><span>{{ money(max) }}</span><span>Saldo realizado · R$</span></div>
      <svg viewBox="0 0 600 260" role="img" aria-label="Saldo por dia de movimentação; valores detalhados abaixo">
        <line x1="22" y1="20" x2="578" y2="20" class="grid" /><line x1="22" y1="120" x2="578" y2="120" class="grid" /><line x1="22" y1="220" x2="578" y2="220" class="grid" />
        <line x1="22" [attr.y1]="y(0)" x2="578" [attr.y2]="y(0)" class="zero" />
        <polyline [attr.points]="points" fill="none" stroke="var(--electric)" stroke-width="3" stroke-linejoin="round" />
        <g *ngFor="let row of rows; let i = index">
          <circle [attr.cx]="x(i)" [attr.cy]="y(row.value)" r="5" fill="var(--electric)"><title>Dia {{ row.label }}: {{ money(row.value) }}</title></circle>
          <text *ngIf="i === 0 || i === rows.length - 1 || i % labelStep === 0" [attr.x]="x(i)" y="250" text-anchor="middle">{{ row.label }}</text>
        </g>
      </svg>
      <div class="scale"><span>{{ money(min) }}</span><span>Dia do mês</span></div>
      <details><summary>Ver saldos por dia</summary><dl><div *ngFor="let row of rows"><dt>Dia {{ row.label }}</dt><dd>{{ money(row.value) }}</dd></div></dl></details>
    </ng-container>
  </figure>`,
  styles: [`:host{display:block;min-width:0}figure{margin:20px 0 0}svg{display:block;width:100%;height:auto;min-height:180px}.grid{stroke:var(--border)}.zero{stroke:var(--muted);stroke-dasharray:5 5}text{fill:var(--text);font-size:18px;font-weight:600}.scale{display:flex;justify-content:space-between;gap:8px;font-size:13px;color:var(--muted)}.scale span:first-child{font-size:15px;font-weight:600;color:var(--text);font-variant-numeric:tabular-nums}summary{margin-top:18px;color:var(--action);cursor:pointer;font-size:14px}dl{max-height:180px;overflow:auto;font-size:15px}dl div{display:flex;justify-content:space-between;padding:6px 0}dd{margin:0;font-weight:600;font-variant-numeric:tabular-nums}`]
})
export class BalanceChartComponent {
  @Input() rows: ChartBar[] = [];
  get min() { return Math.min(0, ...this.rows.map(r => r.value)); }
  get max() { return Math.max(0, ...this.rows.map(r => r.value)); }
  get labelStep() { return Math.max(1, Math.ceil(this.rows.length / 7)); }
  x(index: number) {
    const first = Number(this.rows[0]?.label || 0), last = Number(this.rows.at(-1)?.label || 0);
    return last === first ? 300 : 22 + (Number(this.rows[index].label) - first) / (last - first) * 556;
  }
  y(value: number) { return this.max === this.min ? 120 : 220 - (value - this.min) / (this.max - this.min) * 200; }
  get points() { return this.rows.map((r, i) => `${this.x(i)},${this.y(r.value)}`).join(' '); }
  money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
}
