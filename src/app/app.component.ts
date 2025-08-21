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
  isMenuOpen = false;
  title = 'VetInterpreter';

  /** Publiczne strony, na których pokazujemy pełne menu dla zalogowanych */
  readonly PUBLIC_ROUTES = ['/', '/about', '/blog', '/contact'];

  /** Czy aktualny adres to publiczna strona */
  isOnPublicPage = true;

  constructor(public auth: AuthService, private router: Router) {
    // subskrybuj stan logowania
    this.auth.user$.subscribe(u => this.loggedIn = !!u);

    // nasłuchuj zmian trasy, aby ustawiać isOnPublicPage
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url.split('?')[0].split('#')[0];
        this.isOnPublicPage = this.PUBLIC_ROUTES.includes(url);
      });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
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
