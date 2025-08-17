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
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  isLoggedIn$ = this.user$.pipe(map(u => !!u));

  constructor(private http: HttpClient) {
    // jeśli mamy usera w localStorage, odtwórz stan
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        this.userSubject.next(JSON.parse(rawUser));
      } catch {}
    }
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: User; owner?: any }>(
      `${this.api}/auth/login`,
      { email, password }
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
        // zapisz usera i ownerId (jako obiekt ownera minimalnie)
        localStorage.setItem('user', JSON.stringify({
          id: me.id, email: me.email, firstName: me.firstName, lastName: me.lastName,
          phone: me.phone, isVet: me.isVet
        }));
        localStorage.setItem('owner', JSON.stringify({ id: me.ownerId }));
        this.userSubject.next({
          id: me.id, email: me.email, firstName: me.firstName, lastName: me.lastName,
          phone: me.phone, isVet: me.isVet
        });
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** <<— TEGO BRAKOWAŁO */
  getOwnerId(): string | null {
    const raw = localStorage.getItem('owner');
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      // obsłuż oba przypadki: { id: '...' } albo { _id: '...' }
      return obj.id || obj._id || null;
    } catch {
      return null;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('owner');
    this.userSubject.next(null);
  }
}
