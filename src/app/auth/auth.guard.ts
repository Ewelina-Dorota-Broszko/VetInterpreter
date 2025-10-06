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
    const requireAdmin = route.data?.['requireAdmin'] === true;

    return combineLatest([this.auth.isLoggedIn$, this.auth.user$]).pipe(
      take(1),
      map(([isLoggedIn, user]) => {
        if (!isLoggedIn) {
          return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
        }

        if (requireAdmin) {
          if (user?.role === 'admin') return true;
          return this.router.createUrlTree(['/dashboard']);
        }

        if (requireVet) {
          // akceptujemy zarówno role: 'vet', jak i legacy: isVet=true
          if (user?.role === 'vet' || user?.isVet) return true;
          return this.router.createUrlTree(['/dashboard']);
        }

        return true;
      })
    );
  }
}
