import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FinanceService } from '../services/finance.service';

export const authGuard: CanActivateFn = () => {
  const financeService = inject(FinanceService);
  const router = inject(Router);

  if (financeService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
