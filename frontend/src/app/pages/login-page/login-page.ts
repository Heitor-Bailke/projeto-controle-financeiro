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
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required]
  }, {
    validators: this.passwordsMatchValidator
  });

  isLoading = false;
  showRegister = false;
  statusMessage = '';

  switchForm(register: boolean): void {
    if (this.isLoading) return;
    this.showRegister = register;
    this.statusMessage = '';
  }

  private passwordsMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.financeService.login(this.loginForm.value).subscribe({
      next: () => {
        this.statusMessage = 'Login realizado com sucesso.';
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
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
    if (this.registerForm.invalid) {
      this.statusMessage = 'As senhas não coincidem.';
      return;
    }

    this.isLoading = true;
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
