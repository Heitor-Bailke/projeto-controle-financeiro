import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly tokenKey = 'contas_access_token';
  private readonly refreshTokenKey = 'contas_refresh_token';

  constructor(private http: HttpClient) {}

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap((response) => this.storeTokens(response))
    );
  }

  register(payload: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, payload);
  }

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard`);
  }

  getTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transactions`);
  }

  createTransaction(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions`, payload);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  createCategory(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, payload);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }

  parseOcr(payload: { imageBase64: string; mimeType: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/ocr/parse`, payload);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private storeTokens(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.accessToken);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);
  }
}
