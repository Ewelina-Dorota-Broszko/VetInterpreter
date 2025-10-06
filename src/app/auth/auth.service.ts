import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isVet: boolean;
  role?: 'owner' | 'vet' | 'admin';
  lastLoginAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  isLoggedIn$ = this.user$.pipe(map(u => !!u));

  constructor(private http: HttpClient) {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try { this.userSubject.next(JSON.parse(rawUser)); } catch {}
    }
  }

  /** ===== Helpers ===== */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    const raw = localStorage.getItem('user');
    if (raw) { try { return JSON.parse(raw); } catch { /* ignore */ } }
    let val: User | null = null;
    this.user$.subscribe(u => (val = u)).unsubscribe();
    return val;
  }

  getOwnerId(): string | null {
    const raw = localStorage.getItem('owner');
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      return obj.id || obj._id || null;
    } catch {
      return null;
    }
  }

  /** ===== Auth API ===== */
  login(email: string, password: string) {
    return this.http.post<{ token: string; user: User; owner?: any }>(
      `${this.api}/auth/login`, { email, password }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        if (res.owner) localStorage.setItem('owner', JSON.stringify(res.owner));
        this.userSubject.next(res.user);
      })
    );
  }

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    isVet: boolean;
  }) {
    return this.http.post<{ token: string; user: User; owner?: any }>(
      `${this.api}/auth/register`, data
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        if (res.owner) localStorage.setItem('owner', JSON.stringify(res.owner));
        this.userSubject.next(res.user);
      })
    );
  }

  fetchMe() {
    return this.http.get<{ ownerId: string } & User>(`${this.api}/auth/me`).pipe(
      tap(me => {
        const user: User = {
          id: me.id,
          email: me.email,
          firstName: me.firstName,
          lastName: me.lastName,
          phone: me.phone,
          isVet: me.isVet,
          role: me.role,
          lastLoginAt: me.lastLoginAt
        };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('owner', JSON.stringify({ id: me.ownerId }));
        this.userSubject.next(user);
      })
    );
  }

  /** 🔄 Odświeżenie tokenu – używane przez interceptor */
  refreshToken() {
    // Uwaga: backend /auth/refresh wymaga wciąż ważnego JWT (Authorization: Bearer ...).
    // Jeśli token jest już nieważny, interceptor złapie 401 i wyloguje.
    return this.http.post<{ token: string }>(`${this.api}/auth/refresh`, {}).pipe(
      tap(({ token }) => {
        if (token) localStorage.setItem('token', token);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('owner');
    this.userSubject.next(null);
  }
}
