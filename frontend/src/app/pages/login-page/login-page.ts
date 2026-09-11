import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private financeService = inject(FinanceService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: this.passwordsMatchValidator
  });

  isLoading = false;
  showRegister = false;
  statusMessage = '';
  statusError = false;
  recoveryHelp = false;
  recoveryMode = false;

  invalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!control?.touched && !!control?.invalid;
  }

  switchForm(register: boolean): void {
    if (this.isLoading) return;
    this.showRegister = register;
    this.statusMessage = '';
    this.statusError = false;
    this.recoveryHelp = false;
    this.recoveryMode = false;
  }

  startRecovery(): void {
    if (this.isLoading) return;
    this.recoveryMode = true;
    this.recoveryHelp = false;
    this.statusMessage = '';
    this.statusError = false;
  }

  submitRecovery(): void {
    const email = this.loginForm.get('email');
    email?.markAsTouched();
    if (email?.invalid || this.isLoading) return;
    this.isLoading = true;
    this.financeService.requestPasswordReset(email?.value || '').subscribe({
      next: (response) => {
        this.statusMessage = response.message;
        this.statusError = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.statusMessage = error?.error?.message || 'Não foi possível solicitar a recuperação agora.';
        this.statusError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private passwordsMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  }

  submitLogin(): void {
    if (this.isLoading) return;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.statusError = false;
    this.financeService.login(this.loginForm.value).subscribe({
      next: () => {
        this.statusMessage = 'Login realizado com sucesso.';
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        this.statusError = true;
        const message = error?.error?.message || 'Falha ao entrar. Verifique as credenciais.';
        this.statusMessage = message === 'Credenciais inválidas.'
          ? 'Conta não cadastrada ou senha incorreta. Verifique os dados e tente novamente.'
          : message;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitRegister(): void {
    if (this.isLoading) return;
    this.registerForm.get('name')?.setValue(this.registerForm.value.name?.trim() || '');
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.statusMessage = 'Revise os campos indicados para continuar.';
      this.statusError = true;
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.statusError = false;
    const payload = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    this.financeService.register(payload).subscribe({
      next: () => {
        this.statusMessage = 'Cadastro realizado. Você pode entrar agora.';
        this.registerForm.reset();
        this.isLoading = false;
        this.showRegister = false;
        this.loginForm.patchValue({ email: payload.email, password: '' });
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.statusError = true;
        const message = error?.error?.message || 'Não foi possível concluir o cadastro.';
        this.statusMessage = message === 'E-mail já está em uso.'
          ? 'Este e-mail já está cadastrado. Use outro para continuar.'
          : message;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
