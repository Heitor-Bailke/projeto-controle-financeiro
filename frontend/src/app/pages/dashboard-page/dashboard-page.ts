import { ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { TransactionListComponent } from '../../components/transaction-list';
import { BarChartComponent, ChartBar } from '../../components/bar-chart';
import { SummaryCardsComponent } from '../../components/summary-cards';
import { BalanceChartComponent } from '../../components/balance-chart';
import { CategoryChartComponent } from '../../components/category-chart';
import { FinancialReportComponent } from '../../components/financial-report';
import { balanceSeries, expenseCategories, monthEntries, summarize } from '../../components/financial-metrics';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TransactionListComponent, BarChartComponent, SummaryCardsComponent, BalanceChartComponent, CategoryChartComponent, FinancialReportComponent],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private financeService = inject(FinanceService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  @ViewChild('entryCard') entryCard?: ElementRef<HTMLElement>;
  @ViewChild('confirmDialog') confirmDialog?: ElementRef<HTMLDialogElement>;
  statusError = false;
  loadError = '';
  showDetails = false;
  editingId: string | null = null;
  transactionFilter: 'all' | 'income' | 'expense' | 'pending' = 'all';
  filterOptions = [{ id: 'all', label: 'Todos' }, { id: 'income', label: 'Entradas' }, { id: 'expense', label: 'Despesas' }, { id: 'pending', label: 'Pendentes' }] as const;
  deletion: { kind: 'category' | 'transaction'; id: string; name: string; message: string } | null = null;
  deleting = false;
  deleteError = '';
  ocrLoading = false;
  ocrError = false;
  ocrImage = '';
  ocrFileName = '';
  ocrNeedsReview = false;
  ocrReviewed = false;
  importedFields: string[] = [];
  private fileReader?: FileReader;
  private focusTimer?: ReturnType<typeof setTimeout>;

  dashboard: any = {};
  transactions: any[] = [];
  categories: any[] = [];
  loading = false;
  saving = false;
  savingCategory = false;
  categoryError = false;
  categorySessionExpired = false;
  amountText = '';
  statusMessage = '';
  categoryStatusMessage = '';
  ocrStatusMessage = '';
  ocrPreview = '';
  private statusTimeout: any;
  private categoryStatusTimeout: any;
  private ocrStatusTimeout: any;
  activeTab: 'overview' | 'entries' | 'transactions' | 'comparison' | 'insights' = 'overview';
  months = Array.from({ length: 12 }, (_, index) => index + 1);
  baseMonth = new Date().getMonth() || 12;
  baseYear = new Date().getFullYear() - (new Date().getMonth() === 0 ? 1 : 0);
  comparisonMonth = new Date().getMonth() + 1;
  comparisonYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  get isCurrentMonth(): boolean {
    const today = new Date();
    return this.currentMonth === today.getMonth() + 1 && this.currentYear === today.getFullYear();
  }

  expenseForm: FormGroup = this.fb.group({
    type: ['expense', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(160)]],
    description: [''],
    category: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(0.01), Validators.max(9999999999)]],
    date: [this.today(), Validators.required],
    paymentMethod: ['Pix', Validators.required],
    status: ['settled', Validators.required],
    schedule: ['single'],
    repeatMonths: [12, [Validators.required, Validators.min(2), Validators.max(360), Validators.pattern(/^\d+$/)]],
    account: ['Nubank'],
    recurring: [false],
    installments: [2, [Validators.required, Validators.min(2), Validators.max(360), Validators.pattern(/^\d+$/)]],
    notes: ['']
  });

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    type: ['expense', Validators.required],
    color: ['#0b8fea']
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.loadError = '';
    this.financeService.getTransactions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (transactions) => {
        this.transactions = [...transactions];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Não foi possível carregar seus lançamentos. Tente novamente.';
        this.cdr.detectChanges();
      }
    });

    this.financeService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (categories) => {
        this.categories = [...categories];
        this.syncCategory();
        this.cdr.detectChanges();
      },
      error: (error) => this.handleCategoryError(error, 'carregar as categorias')
    });
  }

  getAvailableCategories(): any[] {
    return this.categories.filter(category => category.type === this.expenseForm.get('type')?.value);
  }

  private getDefaultCategory(): string {
    return this.getAvailableCategories()[0]?.name || '';
  }

  today(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  setType(type: string): void {
    this.expenseForm.patchValue({ type, schedule: 'single' });
    this.syncCategory();
  }

  syncCategory(): void {
    if (this.editingId && this.expenseForm.value.category) return;
    if (!this.getAvailableCategories().some(category => category.name === this.expenseForm.value.category)) {
      this.expenseForm.patchValue({ category: this.getDefaultCategory() });
    }
  }

  updateAmount(event: Event): void {
    this.amountText = (event.target as HTMLInputElement).value;
    const raw = this.amountText.trim().replace(/^R\$\s*/, '');
    const valid = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(raw);
    this.expenseForm.get('amount')?.setValue(valid ? Number(raw.replace(/\./g, '').replace(',', '.')) : null);
    this.expenseForm.get('amount')?.markAsTouched();
  }

  formatAmount(): void {
    const value = this.expenseForm.value.amount;
    if (value !== null) this.amountText = this.formatCurrency(value);
  }

  private showStatus(message: string, error = false): void {
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    this.statusMessage = message;
    this.statusError = error;
    if (error) return;
    this.statusTimeout = setTimeout(() => {
      this.statusMessage = '';
      this.cdr.detectChanges();
    }, 2500);
  }

  private showCategoryStatus(message: string): void {
    if (this.categoryStatusTimeout) {
      clearTimeout(this.categoryStatusTimeout);
    }

    this.categoryStatusMessage = message;
    this.categoryStatusTimeout = setTimeout(() => {
      this.categoryStatusMessage = '';
      this.cdr.detectChanges();
    }, 2500);
  }

  private handleCategoryError(error: any, action: string): void {
    clearTimeout(this.categoryStatusTimeout);
    this.categoryError = true;
    this.categorySessionExpired = error?.status === 401;
    this.categoryStatusMessage = this.categorySessionExpired
      ? 'Sua sessão expirou ou foi encerrada. Entre novamente para cadastrar categorias.'
      : error?.status === 0
        ? 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3000 e tente novamente.'
        : error?.error?.message || `Não foi possível ${action}. Tente novamente.`;
    this.cdr.detectChanges();
  }

  private showOcrStatus(message: string): void {
    if (this.ocrStatusTimeout) {
      clearTimeout(this.ocrStatusTimeout);
    }

    this.ocrStatusMessage = message;
    this.ocrStatusTimeout = setTimeout(() => {
      this.ocrStatusMessage = '';
    }, 2500);
  }

  submitExpense(): void {
    if (this.saving || this.ocrLoading) return;
    if (this.ocrNeedsReview && !this.ocrReviewed) {
      this.showStatus('Confira os campos destacados e confirme a revisão do comprovante antes de salvar.', true);
      return;
    }
    if (!this.showDetails && !this.editingId) {
      this.expenseForm.get('name')?.markAsTouched();
      this.expenseForm.get('amount')?.markAsTouched();
      if (!this.expenseForm.value.name?.trim() || this.expenseForm.get('name')?.invalid || this.expenseForm.get('amount')?.invalid) return;
      this.showDetails = true;
      return;
    }
    if (this.expenseForm.value.schedule !== 'installments') this.expenseForm.patchValue({ installments: 2 });
    if (this.expenseForm.value.schedule !== 'recurring') this.expenseForm.patchValue({ repeatMonths: 12 });
    this.expenseForm.get('name')?.setValue(this.expenseForm.value.name?.trim() || '');
    this.syncCategory();
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.showStatus('Revise os campos indicados antes de salvar.', true);
      return;
    }

    const selectedType = this.expenseForm.get('type')?.value || 'expense';

    const values = this.expenseForm.value;
    const payload = { ...values, recurring: values.schedule === 'recurring',
      installments: values.schedule === 'installments' ? Number(values.installments) : 1,
      repeatMonths: values.schedule === 'recurring' ? Number(values.repeatMonths) : 1 };
    this.saving = true;
    const request = this.editingId ? this.financeService.updateTransaction(this.editingId, payload) : this.financeService.createTransaction(payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        this.amountText = '';
        this.showStatus(this.editingId ? 'Lançamento atualizado.' : payload.recurring || payload.installments > 1 ? 'Lançamentos mensais salvos com sucesso.' : 'Lançamento salvo com sucesso.');
        this.editingId = null;
        this.showDetails = false;
        this.clearReceipt();
        this.expenseForm.reset({
          type: selectedType,
          name: '',
          description: '',
          category: this.getDefaultCategory(),
          amount: null,
          date: this.today(),
          paymentMethod: 'Pix',
          status: 'settled',
          schedule: 'single',
          repeatMonths: 12,
          account: 'Nubank',
          recurring: false,
          installments: 2,
          notes: ''
        });
        this.loadData();
      },
      error: (error: any) => {
        this.saving = false;
        const message = error?.error?.message || 'Não foi possível salvar o lançamento.';
        this.showStatus(message, true);
        this.cdr.detectChanges();
      }
    });
  }

  submitCategory(): void {
    if (this.savingCategory) return;
    this.categoryForm.get('name')?.setValue(this.categoryForm.value.name?.trim() || '');
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.handleCategoryError({ error: { message: 'Informe um nome de categoria com até 120 caracteres e selecione o tipo.' } }, 'criar a categoria');
      return;
    }
    const payload = this.categoryForm.value;
    this.savingCategory = true;
    this.categoryError = false;
    this.categorySessionExpired = false;
    this.categoryStatusMessage = '';
    this.financeService.createCategory(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (category) => {
        this.savingCategory = false;
        this.categories = [...this.categories, category];
        this.syncCategory();
        this.showCategoryStatus('Categoria criada com sucesso.');
        this.categoryForm.reset({ name: '', type: payload.type, color: '#0b8fea' });
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.savingCategory = false;
        this.handleCategoryError(error, 'criar a categoria');
      }
    });
  }

  deleteCategory(categoryId: string): void {
    const category = this.categories.find(item => item.id === categoryId);
    if (!category) return;
    const hasHistory = this.transactions.some(item => item.category === category.name);
    this.openDeletion({ kind: 'category', id: category.id, name: category.name,
      message: hasHistory ? 'Esta categoria aparece no seu histórico. Os lançamentos existentes serão preservados, mas ela deixará de estar disponível para novos registros.' : 'A categoria deixará de estar disponível para novos lançamentos.' });
  }

  getMonthName(month: number): string {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return monthNames[month - 1] || 'Mês';
  }

  getComparisonSummary(): string {
    const difference = this.getMonthExpenses(this.comparisonMonth, this.comparisonYear)
      - this.getMonthExpenses(this.baseMonth, this.baseYear);
    const baseLabel = `${this.getMonthName(this.baseMonth)}/${this.baseYear}`;
    const comparedLabel = `${this.getMonthName(this.comparisonMonth)}/${this.comparisonYear}`;
    if (difference === 0) {
      return `${baseLabel} e ${comparedLabel} têm o mesmo total de despesas.`;
    }
    const direction = difference > 0 ? 'a mais' : 'a menos';
    return `${comparedLabel} teve ${this.formatCurrency(Math.abs(difference))} ${direction} em despesas que ${baseLabel}.`;
  }

  getMonthExpenses(month: number, year: number): number {
    return this.transactions.filter((transaction) => {
      // Preserva o mês da data registrada sem conversão de fuso horário.
      const [transactionYear, transactionMonth] = String(transaction.date)
        .slice(0, 10).split('-').map(Number);
      return transaction.type === 'expense'
        && transactionMonth === Number(month)
        && transactionYear === Number(year);
    }).reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  }

  formatCurrency(value: number): string {
    return this.currency.format(Number(value) || 0);
  }

  getDisplayValue(value: number | undefined | null): string {
    return (value ?? 0).toFixed(2);
  }

  getInsightsMessage(): string {
    const expenses = this.transactions.filter((transaction) => transaction.type === 'expense');
    if (!expenses.length) {
      return 'Comece a registrar lançamentos para desbloquear insights inteligentes.';
    }

    const grouped: Record<string, number> = expenses.reduce((acc, transaction) => {
      const key = transaction.category || 'Sem categoria';
      acc[key] = (acc[key] || 0) + Number(transaction.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(grouped).sort(([, a], [, b]) => b - a)[0];
    return topCategory
      ? `Seu maior gasto segue em ${topCategory[0]} com R$ ${topCategory[1].toFixed(2)}.`
      : 'Seu padrão de gastos está ficando cada vez mais claro.';
  }

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.ocrLoading || this.saving) return;
    this.clearReceipt();
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.ocrError = true;
      this.ocrStatusMessage = 'Selecione uma imagem PNG, JPG ou WebP de até 5 MB.';
      input.value = '';
      return;
    }
    this.ocrLoading = true;
    this.ocrFileName = file.name;
    const reader = new FileReader();
    this.fileReader = reader;
    reader.onerror = () => {
      this.ocrLoading = false;
      this.ocrError = true;
      this.ocrStatusMessage = 'Não foi possível abrir a imagem. Selecione outro arquivo.';
      this.cdr.detectChanges();
    };
    reader.onload = () => {
      const base64 = reader.result as string;
      this.ocrImage = base64;
      const imageBase64 = base64.split(',')[1];
      this.financeService.parseOcr({ imageBase64, mimeType: file.type }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.ocrLoading = false;
          const parsed = response?.parsed;
          if (!parsed || !(Number(parsed.amount) > 0)) {
            this.ocrError = true;
            this.ocrStatusMessage = 'Não foi possível identificar um valor válido. Preencha manualmente ou tente outra imagem.';
            this.cdr.detectChanges();
            return;
          }
          this.ocrPreview = parsed.rawText || '';
          const patch: Record<string, any> = { amount: Number(parsed.amount) };
          if (parsed.merchant) patch['name'] = parsed.merchant;
          const dateParts = String(parsed.date || '').match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
          const date = dateParts ? `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}` : parsed.date;
          if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && !Number.isNaN(Date.parse(date))) patch['date'] = date;
          if (this.getAvailableCategories().some(category => category.name === parsed.category)) patch['category'] = parsed.category;
          this.expenseForm.patchValue(patch);
          this.importedFields = Object.keys(patch);
          this.formatAmount();
          this.showDetails = true;
          this.ocrNeedsReview = true;
          this.ocrReviewed = false;
          this.ocrStatusMessage = 'Dados preenchidos. Confira os campos destacados e confirme a revisão antes de salvar.';
          this.cdr.detectChanges();
        },
        error: () => {
          this.ocrLoading = false;
          this.ocrError = true;
          this.ocrStatusMessage = 'Não foi possível ler o comprovante. Tente novamente ou preencha manualmente.';
          this.cdr.detectChanges();
        }
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  clearReceipt(): void {
    this.ocrImage = ''; this.ocrFileName = ''; this.ocrPreview = ''; this.ocrStatusMessage = '';
    this.ocrError = false; this.ocrNeedsReview = false; this.ocrReviewed = false; this.importedFields = [];
  }

  invalid(field: string): boolean {
    return !!this.expenseForm.get(field)?.touched && !!this.expenseForm.get(field)?.invalid;
  }

  get monthlyTransactions(): any[] {
    return monthEntries(this.transactions, this.currentMonth, this.currentYear);
  }
  get monthSummary() { return summarize(this.monthlyTransactions); }
  get monthIncome(): number { return this.monthSummary.income; }
  get monthExpense(): number { return this.monthSummary.expense; }
  get monthPending(): number { return this.monthSummary.pending; }
  get reportBase() { return monthEntries(this.transactions, this.baseMonth, this.baseYear); }
  get reportCompared() { return monthEntries(this.transactions, this.comparisonMonth, this.comparisonYear); }
  get expenseShare(): string {
    return this.monthIncome ? `${(this.monthExpense / this.monthIncome * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : 'Sem receita';
  }
  get biggestExpense() {
    return [...this.monthlyTransactions].filter(e => e.type === 'expense' && e.status !== 'pending').sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  }
  get availableYears() {
    return [...new Set([new Date().getFullYear(), this.currentYear, ...this.transactions.map(e => Number(String(e.date).slice(0, 4)))])].filter(year => year >= 1900 && year <= 9999).sort((a, b) => b - a);
  }
  get filteredTransactions(): any[] {
    return this.transactions.filter(item => this.transactionFilter === 'all' || (this.transactionFilter === 'pending' ? item.status === 'pending' : item.type === this.transactionFilter));
  }
  get comparisonValid(): boolean {
    return [this.baseYear, this.comparisonYear].every(value => Number.isInteger(value) && value >= 1900 && value <= 9999)
      && [this.baseMonth, this.comparisonMonth].every(value => Number.isInteger(value) && value >= 1 && value <= 12);
  }
  get comparisonBars(): ChartBar[] {
    if (!this.comparisonValid) return [];
    return [{ label: `${this.getMonthName(this.baseMonth)}/${this.baseYear}`, value: this.getMonthExpenses(this.baseMonth, this.baseYear) },
      { label: `${this.getMonthName(this.comparisonMonth)}/${this.comparisonYear}`, value: this.getMonthExpenses(this.comparisonMonth, this.comparisonYear) }];
  }
  get comparisonChange(): string {
    const [base, next] = this.comparisonBars;
    if (!base || !next) return '';
    if (!base.value) return next.value ? 'Sem base para variação percentual' : 'Sem despesas nos dois períodos';
    return `${((next.value - base.value) / base.value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% em relação ao primeiro período`;
  }
  get categoryBars(): ChartBar[] {
    return expenseCategories(this.monthlyTransactions);
  }
  get cashFlowBars(): ChartBar[] {
    return balanceSeries(this.monthlyTransactions);
  }
  get topCategoryShare(): string {
    return this.monthExpense ? `${Math.round((this.categoryBars[0]?.value || 0) / this.monthExpense * 100)}%` : '0%';
  }

  openEntry(): void {
    this.activeTab = 'entries';
    this.cdr.detectChanges();
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      this.entryCard?.nativeElement.scrollIntoView({ block: 'start' });
      this.entryCard?.nativeElement.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    });
  }
  editTransaction(transaction: any): void {
    this.cancelEntry();
    this.editingId = transaction.id;
    this.showDetails = true;
    this.expenseForm.patchValue({ ...transaction, date: String(transaction.date).slice(0, 10), schedule: 'single', installments: 2, repeatMonths: 12 });
    this.formatAmount();
    this.openEntry();
  }
  cancelEntry(): void {
    if (this.saving || this.ocrLoading) return;
    this.editingId = null; this.showDetails = false; this.amountText = ''; this.clearReceipt();
    this.expenseForm.reset({ type: 'expense', name: '', description: '', category: '', amount: null, date: this.today(), paymentMethod: 'Pix', status: 'settled', schedule: 'single', repeatMonths: 12, account: 'Nubank', recurring: false, installments: 2, notes: '' });
    this.syncCategory();
  }
  requestDeleteTransaction(transaction: any): void {
    this.openDeletion({ kind: 'transaction', id: transaction.id, name: transaction.name, message: 'Somente este lançamento será excluído. Outras parcelas ou repetições serão preservadas. Esta ação não pode ser desfeita.' });
  }
  private openDeletion(value: NonNullable<DashboardPageComponent['deletion']>): void {
    this.deletion = value; this.deleteError = ''; this.cdr.detectChanges(); this.confirmDialog?.nativeElement.showModal();
  }
  closeDeletion(): void { if (!this.deleting) { this.confirmDialog?.nativeElement.close(); this.deletion = null; } }
  confirmDeletion(): void {
    if (!this.deletion || this.deleting) return;
    this.deleting = true;
    const target = this.deletion;
    const request = target.kind === 'category' ? this.financeService.deleteCategory(target.id) : this.financeService.deleteTransaction(target.id);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.deleting = false; this.closeDeletion();
        if (this.editingId === target.id) this.cancelEntry();
        this.showStatus(target.kind === 'category' ? 'Categoria removida.' : 'Lançamento excluído.'); this.loadData();
      },
      error: (error) => { this.deleting = false; this.deleteError = error?.error?.message || 'Não foi possível excluir. Tente novamente.'; this.cdr.detectChanges(); }
    });
  }
  ngOnDestroy(): void {
    clearTimeout(this.statusTimeout); clearTimeout(this.categoryStatusTimeout); clearTimeout(this.ocrStatusTimeout); clearTimeout(this.focusTimer);
    if (this.fileReader?.readyState === FileReader.LOADING) this.fileReader.abort();
  }

  logout(): void {
    this.financeService.logout();
    this.router.navigate(['/']);
  }
}
