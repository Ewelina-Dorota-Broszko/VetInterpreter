import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimalsService, Animal } from '../services/animals.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss']
})
export class AddDocumentComponent implements OnInit {
  animals: Animal[] = [];
  selectedAnimal = '';
  selectedType: 
    | 'blood'
    | 'stool'
    | 'urine'
    | 'temperature'
    | 'diabetes'
    | 'weight'
    | 'vaccination'
    | 'medication'
    | 'symptom'
    | 'visit' = 'blood';

  loading = true;
  error = '';

  constructor(
    private router: Router,
    private animalsService: AnimalsService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const ownerId = this.auth.getOwnerId();
    if (!ownerId) {
      // po odświeżeniu strony potwierdzamy tożsamość i dopiero pobieramy zwierzęta
      this.auth.fetchMe().subscribe({
        next: () => this.loadAnimals(),
        error: () => {
          this.loading = false;
          this.error = 'Nie udało się pobrać danych właściciela.';
        }
      });
    } else {
      this.loadAnimals();
    }
  }

  private loadAnimals(): void {
    const ownerId = this.auth.getOwnerId();
    if (!ownerId) {
      this.loading = false;
      this.error = 'Brak zalogowanego właściciela.';
      return;
    }
    this.animalsService.getForOwner(ownerId).subscribe({
      next: (list) => {
        this.animals = list || [];
        this.selectedAnimal = this.animals[0]?._id ?? '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Błąd pobierania zwierząt', err);
        this.error = 'Błąd pobierania zwierząt.';
        this.loading = false;
      }
    });
  }

  navigateToForm(): void {
    if (!this.selectedAnimal || !this.selectedType) return;
    this.router.navigate([`/form/${this.selectedType}`], {
      queryParams: { animalId: this.selectedAnimal }
    });
  }

  trackById = (_: number, a: Animal) => a._id;
}
