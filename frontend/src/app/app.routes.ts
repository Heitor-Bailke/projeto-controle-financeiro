import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] }
];
