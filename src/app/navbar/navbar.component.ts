import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimalsService, Animal } from '../services/animals.service';
import { AuthService } from '../auth/auth.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  animals: Animal[] = [];
  isLogin = false;

  /** Strumień czy użytkownik jest weterynarzem */
  isVet$: Observable<boolean> = this.auth.user$.pipe(map(u => !!u?.isVet));

  constructor(
    private router: Router,
    private animalService: AnimalsService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    // Stan zalogowania — jeśli masz inny mechanizm, możesz go podmienić
    this.auth.user$.subscribe(u => this.isLogin = !!u);

    // Jeśli NIE weterynarz, to ładuj zwierzęta właściciela
    this.isVet$.subscribe(isVet => {
      if (!isVet) this.loadAnimalsForOwner();
      else this.animals = [];
    });
  }

  private loadAnimalsForOwner() {
    const ownerId = this.auth.getOwnerId();
    if (!ownerId) {
      this.auth.fetchMe().subscribe({
        next: () => this.fetchAnimals(),
        error: () => {}
      });
    } else {
      this.fetchAnimals();
    }
  }

  private fetchAnimals() {
    const ownerId = this.auth.getOwnerId();
    if (!ownerId) return;
    this.animalService.getForOwner(ownerId).subscribe({
      next: (res) => this.animals = res || [],
      error: (err) => console.error('Błąd pobierania zwierząt', err),
    });
  }

  // --- Akcje / nawigacja ---
  goToDashboard() { this.router.navigate(['/dashboard']); }
  goToCalendar()  { this.router.navigate(['/calendar']); }
  goToAddDocument() { this.router.navigate(['/add-document']); }
  selectAnimal(animal: Animal) { this.router.navigate(['/animal', animal._id]); }

  trackById = (_: number, a: Animal) => a._id;
}
