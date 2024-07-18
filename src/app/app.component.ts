import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'VetInterpreter';
  isMenuOpen = false;

  constructor(private router: Router) {}

  isActive(url: string): boolean {
    return this.router.url === url;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
