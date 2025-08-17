import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, MeResponse } from './auth.models';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;

  private _isLoggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem(TOKEN_KEY));
  isLoggedIn$ = this._isLoggedIn$.asObservable();

  private _me$ = new BehaviorSubject<MeResponse | null>(null);
  me$ = this._me$.asObservable();

  constructor(private http: HttpClient) {
    if (this._isLoggedIn$.value) {
      this.fetchMe().subscribe({ error: () => this.logout() });
    }
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.api}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(TOKEN_KEY, res.token);
          this._isLoggedIn$.next(true);
        }),
        tap(() => this.fetchMe().subscribe())
      );
  }

  fetchMe() {
    return this.http.get<MeResponse>(`${this.api}/auth/me`)
      .pipe(tap(me => this._me$.next(me)));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this._isLoggedIn$.next(false);
    this._me$.next(null);
  }
}
