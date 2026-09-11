import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { FinanceService } from '../services/finance.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const financeService = inject(FinanceService);
  const token = financeService.getAccessToken();

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};
