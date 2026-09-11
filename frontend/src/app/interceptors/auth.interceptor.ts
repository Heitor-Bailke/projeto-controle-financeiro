import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { FinanceService } from '../services/finance.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const financeService = inject(FinanceService);
  return next(req.clone({ withCredentials: true }));
};
