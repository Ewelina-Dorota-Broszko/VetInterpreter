import { Injectable } from '@angular/core';
import {
  CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VetService, isVetProfileComplete } from '../services/vet.service';

@Injectable({ providedIn: 'root' })
export class VetProfileCompleteGuard implements CanActivate, CanActivateChild {

  constructor(private vet: VetService, private router: Router) {}

  /** Zbuduj URL do profilu z powodem i powrotem na poprzednią stronę */
  private toProfile(returnUrl: string): UrlTree {
    return this.router.createUrlTree(
      ['/vet/profile'],
      { queryParams: { reason: 'completeProfile', returnUrl } }
    );
  }

  /** Sprawdź kompletność profilu; przy braku – przekieruj z returnUrl */
  private checkProfile(returnUrl: string): Observable<boolean | UrlTree> {
    return this.vet.getMe().pipe(
      map(p => isVetProfileComplete(p) ? true : this.toProfile(returnUrl)),
      catchError(() => of(this.toProfile(returnUrl)))
    );
  }

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkProfile(state.url);
  }

  // Na /vet/profile wpuszczamy zawsze; reszta wymaga kompletnego profilu
  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const path = childRoute.routeConfig?.path ?? '';
    if (path === 'profile') return true;
    return this.checkProfile(state.url);
  }
}
