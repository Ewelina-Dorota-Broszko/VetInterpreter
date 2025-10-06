import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRedirecting = false;

  // === refresh single-flight ===
  private refreshInProgress = false;
  private refreshToken$ = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const apiBase = (environment.apiUrl || '').replace(/\/+$/, '');
    const reqUrl = req.url.replace(/\/+$/, '');

    // Czy to żądanie do naszego API? (obsłuż też względne ścieżki „/api/…”)
    const isAbsoluteApi = apiBase && reqUrl.startsWith(apiBase);
    const isRelativeApi = !/^https?:\/\//i.test(reqUrl) && reqUrl.startsWith('/'); // jeśli używasz względnych
    const isApiCall = isAbsoluteApi || isRelativeApi;

    // ENDPOINTY, przy których:
    // - nie dokładamy tokena
    // - nie robimy retry/refresh
    const isLoginOrRegister = isApiCall && (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register'));
    const isRefreshCall = isApiCall && reqUrl.includes('/auth/refresh');

    const token = this.auth.getToken();
    const shouldAttachToken = isApiCall && !!token && !isLoginOrRegister;

    const authReq = shouldAttachToken
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // Bieżąca ścieżka w SPA
        const currentUrl = (this.router.url || '').split('?')[0];
        const onLogin = currentUrl === '/login';
        const onRegister = currentUrl === '/register';

        // 401 — spróbujmy JEDNORAZOWO refresh (o ile to ma sens)
        if (err.status === 401 && shouldAttachToken && !isLoginOrRegister && !isRefreshCall) {
          return this.tryRefreshAndReplay(authReq, next).pipe(
            catchError((refreshErr) => {
              // refresh się nie powiódł — standardowy logout + redirect na /login
              this.safeLogoutRedirect(onLogin);
              return throwError(() => err);
            })
          );
        }

        // 401 z login/register: zwykły błąd logowania — nie wylogowuj
        if (err.status === 401) {
          if (!isLoginOrRegister && !onLogin) {
            this.safeLogoutRedirect(onLogin);
          }
          return throwError(() => err);
        }

        // 403 — brak uprawnień (np. wejście w /admin bez roli admin)
        if (err.status === 403) {
          if (!onLogin && !onRegister && !this.isRedirecting) {
            this.isRedirecting = true;
            this.router.navigate(['/']).finally(() => (this.isRedirecting = false));
          }
          return throwError(() => err);
        }

        // Inne błędy: leć dalej
        return throwError(() => err);
      })
    );
  }

  /** Jednorazowa próba odświeżenia tokenu i powtórzenia requestu */
  private tryRefreshAndReplay(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.refreshInProgress) {
      this.refreshInProgress = true;
      this.refreshToken$.next(null);

      return this.auth.refreshToken().pipe(
        switchMap((/* { token } jest zapisany w AuthService */) => {
          this.refreshInProgress = false;
          const newToken = this.auth.getToken();
          this.refreshToken$.next(newToken || '');
          const cloned = newToken
            ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
            : req;
          return next.handle(cloned);
        }),
        catchError((e) => {
          this.refreshInProgress = false;
          this.refreshToken$.next(null);
          throw e;
        })
      );
    } else {
      // czekamy, aż pierwszy refresh się zakończy
      return this.refreshToken$.pipe(
        filter(t => t !== null), // czekaj aż coś zostanie „wypchnięte”
        take(1),
        switchMap((newToken) => {
          const cloned = newToken
            ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
            : req;
          return next.handle(cloned);
        })
      );
    }
  }

  private safeLogoutRedirect(onLogin: boolean) {
    this.auth.logout();
    if (!onLogin && !this.isRedirecting) {
      this.isRedirecting = true;
      this.router.navigate(['/login']).finally(() => (this.isRedirecting = false));
    }
  }
}
