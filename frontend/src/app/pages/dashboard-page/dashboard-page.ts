import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private financeService = inject(FinanceService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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
  activeTab: 'overview' | 'transactions' | 'comparison' | 'insights' = 'overview';
  months = Array.from({ length: 12 }, (_, index) => index + 1);
  baseMonth = new Date().getMonth() + 1;
  baseYear = new Date().getFullYear();
  comparisonMonth = this.baseMonth === 1 ? 12 : this.baseMonth - 1;
  comparisonYear = this.baseMonth === 1 ? this.baseYear - 1 : this.baseYear;
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();

  expenseForm: FormGroup = this.fb.group({
    type: ['expense', Validators.required],
    name: ['', Validators.required],
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
    color: ['#6366f1']
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.financeService.getDashboard().subscribe((response) => {
      this.dashboard = response;
      this.cdr.detectChanges();
    });

    this.financeService.getTransactions().subscribe((transactions) => {
      this.transactions = [...transactions];
      this.loading = false;
      this.cdr.detectChanges();
    });

    this.financeService.getCategories().subscribe({
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

  private showStatus(message: string): void {
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    this.statusMessage = message;
    this.statusTimeout = setTimeout(() => {
      this.statusMessage = '';
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
    if (this.saving) return;
    if (this.expenseForm.value.schedule !== 'installments') this.expenseForm.patchValue({ installments: 2 });
    if (this.expenseForm.value.schedule !== 'recurring') this.expenseForm.patchValue({ repeatMonths: 12 });
    this.expenseForm.get('name')?.setValue(this.expenseForm.value.name?.trim() || '');
    this.syncCategory();
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.showStatus('Preencha nome, categoria, valor maior que zero, data e os detalhes da repetição corretamente.');
      return;
    }

    const selectedType = this.expenseForm.get('type')?.value || 'expense';

    const values = this.expenseForm.value;
    const payload = { ...values, recurring: values.schedule === 'recurring',
      installments: values.schedule === 'installments' ? Number(values.installments) : 1,
      repeatMonths: values.schedule === 'recurring' ? Number(values.repeatMonths) : 1 };
    this.saving = true;
    this.financeService.createTransaction(payload).subscribe({
      next: () => {
        this.saving = false;
        this.amountText = '';
        this.showStatus(payload.recurring || payload.installments > 1 ? 'Lançamentos mensais salvos com sucesso.' : 'Lançamento salvo com sucesso.');
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
        this.showStatus(message);
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
    this.financeService.createCategory(payload).subscribe({
      next: (category) => {
        this.savingCategory = false;
        this.categories = [...this.categories, category];
        this.syncCategory();
        this.showCategoryStatus('Categoria criada com sucesso.');
        this.categoryForm.reset({ name: '', type: payload.type, color: '#6366f1' });
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.savingCategory = false;
        this.handleCategoryError(error, 'criar a categoria');
      }
    });
  }

  deleteCategory(categoryId: string): void {
    this.financeService.deleteCategory(categoryId).subscribe(() => {
      this.showStatus('Categoria removida.');
      this.loadData();
    });
  }

  getMonthName(month: number): string {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return monthNames[month - 1] || 'Mês';
  }

  getComparisonSummary(): string {
    const difference = this.getMonthExpenses(this.baseMonth, this.baseYear)
      - this.getMonthExpenses(this.comparisonMonth, this.comparisonYear);
    const baseLabel = `${this.getMonthName(this.baseMonth)}/${this.baseYear}`;
    const comparedLabel = `${this.getMonthName(this.comparisonMonth)}/${this.comparisonYear}`;
    if (difference === 0) {
      return `${baseLabel} e ${comparedLabel} têm o mesmo total de despesas.`;
    }
    const direction = difference > 0 ? 'a mais' : 'a menos';
    return `${baseLabel} teve ${this.formatCurrency(Math.abs(difference))} ${direction} em despesas que ${comparedLabel}.`;
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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL'
    }).format(value);
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
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const imageBase64 = base64.split(',')[1];
      this.financeService.parseOcr({ imageBase64, mimeType: file.type }).subscribe({
        next: (response) => {
          this.ocrPreview = response.parsed.rawText;
          this.expenseForm.patchValue({
            name: response.parsed.merchant,
            amount: Number(response.parsed.amount),
            date: response.parsed.date,
            category: response.parsed.category
          });
          this.syncCategory();
          this.formatAmount();
          this.showOcrStatus('Dados da nota fiscal preenchidos.');
        },
        error: () => {
          this.showOcrStatus('Não foi possível ler a nota fiscal.');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  logout(): void {
    this.financeService.logout();
    this.router.navigate(['/']);
  }
}
