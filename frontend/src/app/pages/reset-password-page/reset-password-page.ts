import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.css'
})
export class ResetPasswordPageComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private financeService = inject(FinanceService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  token = this.route.snapshot.queryParamMap.get('token') || '';
  isLoading = false;
  completed = false;
  statusMessage = '';
  statusError = false;
  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', Validators.required]
  });

  invalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control?.touched && !!control?.invalid;
  }

  passwordsMismatch(): boolean {
    return this.form.touched && this.form.value.password !== this.form.value.confirmPassword;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (!this.token) {
      this.statusError = true;
      this.statusMessage = 'Este link de recuperação é inválido ou está incompleto.';
      return;
    }
    if (this.form.invalid || this.passwordsMismatch() || this.isLoading) return;
    this.isLoading = true;
    this.statusMessage = '';
    this.financeService.resetPassword({ token: this.token, newPassword: this.form.value.password || '' }).subscribe({
      next: (response) => {
        this.completed = true;
        this.statusError = false;
        this.statusMessage = response.message;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.statusError = true;
        this.statusMessage = error?.error?.message || 'Não foi possível redefinir sua senha.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/']);
  }
}
