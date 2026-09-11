import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartBar } from './bar-chart';
@Component({
  selector: 'app-category-chart', imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<figure aria-label="Participação das categorias nas despesas pagas">
    <p class="muted" *ngIf="!total">Nenhuma despesa paga neste mês. Os gastos aparecerão aqui após o primeiro pagamento.</p>
    <div class="distribution" *ngIf="total">
      <div class="donut" [style.background]="gradient" role="img" aria-label="Distribuição das despesas; valores e percentuais na legenda">
        <div class="center" aria-live="polite"><small>{{ selected?.label || 'Total pago' }}</small><strong>{{ money(selected?.value ?? total) }}</strong><span>{{ selected ? percent(selected.value) + '%' : rows.length + ' categorias' }}</span></div>
      </div>
      <ul><li *ngFor="let row of rows; let i = index"><button type="button" [class.chosen]="selected?.label === row.label" (mouseenter)="selected = row" (mouseleave)="selected = null" (focus)="selected = row" (blur)="selected = null" (click)="selected = row">
        <i [style.background]="color(i)" aria-hidden="true"></i><span>{{ row.label }}<small>{{ money(row.value) }}</small></span><b>{{ percent(row.value) }}%</b>
      </button></li></ul>
    </div>
  </figure>`,
  styles: [`figure{margin:20px 0 0}.distribution{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:28px}.donut{width:220px;height:220px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}.center{background:var(--surface);width:164px;height:164px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12px}.center small{max-width:100%;overflow-wrap:anywhere;color:var(--muted);font-size:12px}.center strong{font-size:20px;margin:7px 0;font-variant-numeric:tabular-nums}.center span{font-size:11px;color:var(--muted)}ul{list-style:none;padding:0;margin:0;flex:1;min-width:200px;max-height:340px;overflow:auto}button{display:flex;text-align:left;width:100%;background:transparent;color:var(--text);padding:10px 8px;font-weight:500;font-size:12px}button:hover,.chosen{background:var(--canvas)}i{width:10px;height:10px;border-radius:3px;flex-shrink:0}button span{flex:1;overflow-wrap:anywhere}button small{display:block;color:var(--muted);font-size:11px}b{font-variant-numeric:tabular-nums}`]
})
export class CategoryChartComponent {
  @Input() rows: ChartBar[] = [];
  private selectedLabel: string | null = null;
  get selected(): ChartBar | null { return this.rows.find(row => row.label === this.selectedLabel) || null; }
  set selected(row: ChartBar | null) { this.selectedLabel = row?.label || null; }
  get total() { return this.rows.reduce((sum, r) => sum + Math.round(r.value * 100), 0) / 100; }
  color(index: number) { return ['#0b8fea', '#06172e', '#20a36a', '#d49a27', '#7759c2', '#d95959', '#00868b'][index % 7]; }
  percent(value: number) { return (this.total ? value / this.total * 100 : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }); }
  money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  get gradient() {
    let position = 0;
    return `conic-gradient(${this.rows.map((row, i) => {
      const start = position; position += row.value / this.total * 100;
      return `${this.color(i)} ${start}% ${position}%`;
    }).join(',')})`;
  }
}
