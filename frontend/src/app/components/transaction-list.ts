import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-list',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state" *ngIf="!items.length">
      <strong>{{ emptyTitle }}</strong><p>{{ emptyDescription }}</p>
      <button type="button" (click)="add.emit()">Adicionar lançamento</button>
    </div>
    <ul class="transaction-list" *ngIf="items.length">
      <li class="transaction-row" *ngFor="let item of items; trackBy: trackId">
        <span class="direction" [class.income]="item.type === 'income'" aria-hidden="true">{{ item.type === 'income' ? '↙' : '↗' }}</span>
        <div class="transaction-detail"><strong>{{ item.name }}</strong>
          <p>{{ item.date | date:'dd/MM/yyyy':'UTC' }} · {{ item.category || 'Sem categoria' }}<span *ngIf="item.paymentMethod"> · {{ item.paymentMethod }}</span></p>
          <p *ngIf="item.description && !compact">{{ item.description }}</p>
        </div>
        <div class="transaction-value">
          <strong [class.income]="item.type === 'income'" [class.expense]="item.type !== 'income'">{{ item.type === 'income' ? '+' : '−' }} {{ money(item.amount) }}</strong>
          <span class="pill" [class.pending]="item.status === 'pending'">{{ item.status === 'pending' ? (item.type === 'income' ? 'A receber' : 'Pendente') : (item.type === 'income' ? 'Recebido' : 'Pago') }}</span>
        </div>
        <div class="row-actions" *ngIf="!compact">
          <button type="button" class="text-button" (click)="edit.emit(item)" [attr.aria-label]="'Editar ' + item.name">Editar</button>
          <button type="button" class="text-button danger-text" (click)="remove.emit(item)" [attr.aria-label]="'Excluir ' + item.name">Excluir</button>
        </div>
      </li>
    </ul>`,
  styles: [`:host{display:block}.transaction-list{list-style:none;margin:0;padding:0}.transaction-row{display:flex;align-items:center;gap:16px;padding:20px 0;border-bottom:1px solid var(--border)}.transaction-row:last-child{border:0}.transaction-detail{flex:1;min-width:0;overflow-wrap:anywhere}.transaction-detail strong{font-weight:650}.transaction-detail p{font-size:12px;color:var(--muted);margin:5px 0 0}.transaction-value{display:flex;align-items:flex-end;flex-direction:column;gap:8px;font-variant-numeric:tabular-nums}.transaction-value strong{white-space:nowrap;font-size:14px}.direction{display:grid;place-items:center;width:36px;height:36px;flex-shrink:0;background:var(--blue-100);color:var(--navy);border-radius:10px;font-size:19px}.row-actions{display:flex;gap:4px}@media(max-width:650px){.transaction-row{flex-wrap:wrap;gap:12px}.direction{display:none}.transaction-detail{flex-basis:50%}.row-actions{width:100%;justify-content:flex-end}.transaction-value strong{font-size:13px}}`]
})
export class TransactionListComponent {
  @Input() items: any[] = [];
  @Input() compact = false;
  @Input() emptyTitle = 'Seu histórico começa aqui';
  @Input() emptyDescription = 'Registre uma entrada ou saída para acompanhar suas movimentações.';
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() remove = new EventEmitter<any>();
  private currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  money(value: number): string { return this.currency.format(Number(value)); }
  trackId(_index: number, item: any): string { return item.id; }
}
