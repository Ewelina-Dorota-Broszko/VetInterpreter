import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVet: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl; // np. http://localhost:4000

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get user(): AuthUser | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) as AuthUser : null;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  login(email: string, password: string) {
    return firstValueFrom(
      this.http.post<{ token: string; user: AuthUser }>(`${this.api}/auth/login`, { email, password })
        .pipe(
          tap((res) => {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
          })
        )
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
