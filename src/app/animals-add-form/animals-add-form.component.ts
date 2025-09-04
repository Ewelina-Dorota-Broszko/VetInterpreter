import { Component, OnInit } from '@angular/core';
import { AnimalsService } from '../services/animals.service';

type Species = 'dog' | 'cat' | 'other';
type Sex = 'male' | 'female';
type Num = number | '';

@Component({
  selector: 'app-animals-add-form',
  templateUrl: './animals-add-form.component.html',
  styleUrls: ['./animals-add-form.component.scss']
})
export class AnimalsAddFormComponent implements OnInit {
  ownerId: string | null = null;

  // Model formularza (template-driven)
  formData = {
    basic: {
      name: '',
      species: 'dog' as Species,
      breed: '',
      sex: 'male' as Sex,
      weightKg: '' as Num,
      birthDate: '' // YYYY-MM-DD
    }
  };

  saving = false;
  okMsg = '';
  error = '';
  loadingOwner = true;

  speciesOptions: { value: Species; label: string }[] = [
    { value: 'dog', label: 'Pies' },
    { value: 'cat', label: 'Kot' },
    { value: 'other', label: 'Inne' },
  ];

  sexOptions: { value: Sex; label: string }[] = [
    { value: 'male', label: 'Samiec' },
    { value: 'female', label: 'Samica' },
  ];

  constructor(private animals: AnimalsService) {}

  ngOnInit(): void {
    // pobierz/utwórz ownera zalogowanego usera
    this.animals.getMyOwner().subscribe({
      next: (owner) => {
        this.ownerId = owner._id;
        this.loadingOwner = false;
      },
      error: () => {
        this.error = 'Nie udało się pobrać profilu właściciela.';
        this.loadingOwner = false;
      }
    });
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.ownerId) {
      this.error = 'Brak profilu właściciela (ownerId). Zaloguj się ponownie.';
      return;
    }

    const b = this.formData.basic;

    // Walidacja minimalna (jak w blood-form)
    if (!b.name?.trim()) {
      this.error = 'Podaj imię zwierzaka.';
      return;
    }
    if (!b.birthDate) {
      this.error = 'Uzupełnij datę urodzenia.';
      return;
    }

    const payload: any = {
      name: b.name.trim(),
      species: b.species,
      breed: b.breed.trim() || undefined,
      sex: b.sex,
      weightKg: toNum(b.weightKg),
      birthDate: b.birthDate // YYYY-MM-DD
    };

    this.saving = true;
    this.animals.addForOwner(this.ownerId, payload).subscribe({
      next: (created) => {
        this.okMsg = 'Zwierzak dodany.';
        this.saving = false;
        this.resetForm(); // tak jak w blood-form
        // ewentualnie: nawigacja do profilu zwierzaka
        // this.router.navigate(['/animals', created._id]);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się dodać zwierzaka.';
        this.saving = false;
      }
    });

    function toNum(v: Num): number | undefined {
      if (v === '' || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    }
  }

  private resetForm() {
    this.formData = {
      basic: {
        name: '',
        species: 'dog',
        breed: '',
        sex: 'male',
        weightKg: '',
        birthDate: ''
      }
    };
  }
}
