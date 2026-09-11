import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page';
import { authGuard } from './guards/auth.guard';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page';

export const routes: Routes = [
  { path: '', component: LoginPageComponent },
  { path: 'reset-password', component: ResetPasswordPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] }
];
