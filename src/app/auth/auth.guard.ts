import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const requireVet = route.data?.['requireVet'] === true;

    return combineLatest([this.auth.isLoggedIn$, this.auth.user$]).pipe(
      take(1),
      map(([isLoggedIn, user]) => {
        // 1) niezalogowany -> /login (z powrotem na docelową trasę po zalogowaniu)
        if (!isLoggedIn) {
          return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
        }

        // 2) jeżeli trasa wymaga roli "vet", a user jej nie ma -> /dashboard
        if (requireVet && !user?.isVet) {
          return this.router.createUrlTree(['/dashboard']);
        }

        // 3) OK
        return true;
      })
    );
  }
}
