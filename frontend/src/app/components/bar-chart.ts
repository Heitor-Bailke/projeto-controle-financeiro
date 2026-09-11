import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
export interface ChartBar { label: string; value: number; }
@Component({
  selector: 'app-bar-chart', imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<figure [attr.aria-label]="label"><figcaption>{{ label }}</figcaption>
    <p class="muted" *ngIf="!rows.length">Não há despesas registradas neste período.</p>
    <div class="chart-row" *ngFor="let row of rows; let i = index">
      <div class="chart-label"><span>{{ row.label }}</span><strong>{{ money(row.value) }}</strong></div>
      <div class="bar-track" aria-hidden="true"><div class="bar" [class.secondary]="i % 2 !== 0" [style.width.%]="width(row.value)"></div></div>
    </div></figure>`,
  styles: [`figure{margin:24px 0}figcaption{text-transform:uppercase;letter-spacing:1.5px;font-size:11px;font-weight:650;color:var(--muted);margin-bottom:24px}.chart-row{margin-top:20px}.chart-label{display:flex;justify-content:space-between;gap:16px;font-size:13px;margin-bottom:10px;overflow-wrap:anywhere}.chart-label strong{white-space:nowrap;font-variant-numeric:tabular-nums}.bar-track{height:18px;border-radius:5px;background:var(--canvas);overflow:hidden}.bar{height:100%;background:var(--electric);border-radius:5px}.bar.secondary{background:var(--navy)}`]
})
export class BarChartComponent {
  @Input() rows: ChartBar[] = []; @Input() label = 'Despesas';
  private currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  money(value: number): string { return this.currency.format(value); }
  width(value: number): number { const max = Math.max(0, ...this.rows.map(row => row.value)); return max ? value / max * 100 : 0; }
}
