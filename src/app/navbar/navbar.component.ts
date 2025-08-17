import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimalsService, Animal } from '../services/animals.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  animals: Animal[] = [];
  isLogin = false;

  constructor(
    private router: Router,
    private animalService: AnimalsService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const ownerId = this.auth.getOwnerId();
    if (!ownerId) {
      // jeśli brak danych, dociągnij /auth/me (np. po odświeżeniu strony)
      this.auth.fetchMe().subscribe({
        next: () => this.loadAnimals(),
        error: () => {},
      });
    } else {
      this.loadAnimals();
    }
  }

  private loadAnimals() {
    const ownerId = this.auth.getOwnerId();
    if (!ownerId) return;
    this.animalService.getForOwner(ownerId).subscribe({
      next: (res: any) => (this.animals = res),
      error: (err: any) => console.error('Błąd pobierania zwierząt', err),
    });
  }

  // --- Nawigacja główna ---
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
  goToCalendar() {
    this.router.navigate(['/calendar']);
  }
  goToDocuments() {
    this.router.navigate(['/documents']);
  }

  // --- Zwierzęta ---
  selectAnimal(animal: Animal) {
    this.router.navigate(['/animal', animal._id]);
  }

  // --- Dokumenty (dodawanie) ---
  goToAddDocument() {
    this.router.navigate(['/add-document']);
  }

  trackById = (_: number, a: Animal) => a._id;
}
