import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRedirecting = false;

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const apiUrl = environment.apiUrl?.replace(/\/+$/, ''); // bez końcowego /
    const url = req.url.replace(/\/+$/, '');

    // Czy to żądanie do naszego API?
    const isApiCall = apiUrl && url.startsWith(apiUrl);

    // Nie dołączaj tokena do login/register; dołącz do auth/me i pozostałych
    const isAuthLoginOrRegister =
      isApiCall && (url.includes('/auth/login') || url.includes('/auth/register'));

    const token = this.auth.getToken();
    const shouldAttachToken = isApiCall && !!token && !isAuthLoginOrRegister;

    const authReq = shouldAttachToken
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // ścieżki, przy których NIE robimy redirectów
        const currentUrl = this.router.url.split('?')[0];
        const onLogin = currentUrl === '/login';
        const onRegister = currentUrl === '/register';

        if (err.status === 401) {
          // 401 przy login/register to normalne (złe dane) — nie wylogowuj
          if (!isAuthLoginOrRegister && !onLogin) {
            this.auth.logout();
            if (!this.isRedirecting) {
              this.isRedirecting = true;
              this.router.navigate(['/login']).finally(() => (this.isRedirecting = false));
            }
          }
        } else if (err.status === 403) {
          // brak uprawnień — np. wejście w trasę weta bez uprawnień
          if (!onLogin && !onRegister && !this.isRedirecting) {
            this.isRedirecting = true;
            this.router.navigate(['/']).finally(() => (this.isRedirecting = false));
          }
        }

        return throwError(() => err);
      })
    );
  }
}
