import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { FinanceService } from '../services/finance.service';

export const authGuard: CanActivateFn = () => {
  const financeService = inject(FinanceService);
  const router = inject(Router);

  return financeService.currentUser().pipe(
    map((authenticated) => authenticated ? true : router.createUrlTree(['/']))
  );
};
