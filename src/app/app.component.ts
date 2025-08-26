import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  loggedIn = false;
  isOnPublicPage = true;
  readonly PUBLIC_ROUTES = ['/', '/about', '/blog', '/contact'];

  constructor(public auth: AuthService, private router: Router) {
    this.auth.user$.subscribe(u => this.loggedIn = !!u);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url.split('?')[0].split('#')[0];
        this.isOnPublicPage = this.PUBLIC_ROUTES.includes(url);
      });
  }

  isActive(path: string): boolean {
    const clean = this.router.url.split('?')[0].split('#')[0];
    return clean === path;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
