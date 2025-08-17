import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'VetInterpreter';
  isMenuOpen = false;
  isLogin = false;

  pets = 2;
  documents = 0;
  blood_tests = 0;
  general_examinations = 0
  notes = 0; 

  constructor(private auth: AuthService, private router: Router) {}
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  isActive(url: string): boolean {
    return this.router.url === url;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  Login() {
    this.isLogin = !this.isLogin;
  }
}
