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

  // Proste, rozłączne strumienie roli (działają i z nowym polem role, i ze starym isVet)
  isAdmin$: Observable<boolean> = this.auth.user$.pipe(
    map(u => !!u && (u as any).role === 'admin')
  );
  isVet$: Observable<boolean> = this.auth.user$.pipe(
    map(u => {
      if (!u) return false;
      const role = (u as any).role as 'owner'|'vet'|'admin'|undefined;
      return role ? role === 'vet' : !!u.isVet;
    })
  );
  isOwner$: Observable<boolean> = this.auth.user$.pipe(
    map(u => {
      if (!u) return false;
      const role = (u as any).role as 'owner'|'vet'|'admin'|undefined;
      return role ? role === 'owner' : !u.isVet;
    })
  );

  constructor(
    private router: Router,
    private animalService: AnimalsService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(u => (this.isLogin = !!u));

    // Ładuj listę zwierząt tylko w widoku właściciela
    this.isOwner$.subscribe(isOwner => {
      if (isOwner) this.loadAnimalsForOwner();
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
      next: res => (this.animals = res || []),
      error: err => console.error('Błąd pobierania zwierząt', err),
    });
  }

  getAnimalIcon(species: string): string {
    switch (species) {
      case 'dog': return 'assets/images/bone.png';
      case 'cat': return 'assets/images/paw.png';
      default:    return 'assets/images/bed.png';
    }
  }

  // Nawigacja
  goToDashboard() { this.router.navigate(['/dashboard']); }
  goToCalendar()  { this.router.navigate(['/calendar']); }
  goToAddDocument() { this.router.navigate(['/add-document']); }
  selectAnimal(animal: Animal) { this.router.navigate(['/animal', animal._id]); }

  trackById = (_: number, a: Animal) => a._id;
}
