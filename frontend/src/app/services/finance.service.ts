import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; avatar: string };
}

export interface DashboardResponse {
  monthLabel: string;
  balance: number;
  totalExpense: number;
  totalIncome: number;
  totalSaved: number;
  expenseCount: number;
  incomeCount: number;
  goal: number;
  biggestExpense: { name: string; amount: number } | null;
  recentTransactions: any[];
  categories: { name: string; value: number }[];
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly apiUrl = `${window.location.protocol}//${window.location.hostname}:3000/api`;
  private sessionActive = false;

  constructor(private http: HttpClient) {}

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, payload, { withCredentials: true }).pipe(
      map((response) => { this.sessionActive = true; return response; })
    );
  }

  register(payload: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, payload, { withCredentials: true });
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email }, { withCredentials: true });
  }

  resetPassword(payload: { token: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, payload, { withCredentials: true });
  }

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard`, { withCredentials: true });
  }

  getTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transactions`, { withCredentials: true });
  }

  createTransaction(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions`, payload, { withCredentials: true });
  }

  updateTransaction(id: string, payload: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/transactions/${id}`, payload, { withCredentials: true });
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/transactions/${id}`, { withCredentials: true });
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`, { withCredentials: true });
  }

  createCategory(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, payload, { withCredentials: true });
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`, { withCredentials: true });
  }

  parseOcr(payload: { imageBase64: string; mimeType: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/ocr/parse`, payload, { withCredentials: true });
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({ next: () => { this.sessionActive = false; }, error: () => { this.sessionActive = false; } });
  }

  isAuthenticated(): boolean {
    return this.sessionActive;
  }

  getAccessToken(): string | null {
    return null;
  }

  currentUser(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/auth/me`, { withCredentials: true }).pipe(
      map(() => { this.sessionActive = true; return true; }),
      catchError(() => { this.sessionActive = false; return of(false); })
    );
  }
}
