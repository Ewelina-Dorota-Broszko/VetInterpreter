import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

type Num = number | null;

@Component({
  selector: 'app-symptoms-form',
  templateUrl: './symptoms-form.component.html',
  styleUrls: ['./symptoms-form.component.scss']
})
export class SymptomsFormComponent implements OnInit {
  animalId: string | null = null;

  /** Predefiniowane tagi objawów (rozszerz w razie potrzeby) */
  symptomTagOptions: string[] = [
    'gorączka',
    'kaszel',
    'kichanie',
    'biegunka',
    'wymioty',
    'kulawizna',
    'świąd',
    'wysypka',
    'apatia',
    'duszność',
    'brak pragnienia',
    'wzmożone pragnienie',
    'częste oddawanie moczu',
    'ból brzucha',
    'utrata masy ciała',
    'brak apetytu',
    'nadmierny apetyt',
  ];

  /** Dane formularza */
  formData = {
    date: '',
    symptomTags: [] as string[],
    painScore: null as Num,   // 0–10
    energy: null as Num,      // 1–5 (1= bardzo niska, 5= bardzo wysoka)
    appetite: null as Num,    // 1–5 (1= brak, 5= bardzo dobry)
    notes: ''
  };

  saving = false;
  okMsg = '';
  error = '';

  constructor(private route: ActivatedRoute, private animals: AnimalsService) {}

  ngOnInit(): void {
    this.animalId = this.route.snapshot.queryParamMap.get('animalId');
  }

  /** Zaznacz/odznacz tag objawu */
  toggleTag(tag: string) {
    const set = new Set(this.formData.symptomTags);
    if (set.has(tag)) set.delete(tag); else set.add(tag);
    this.formData.symptomTags = Array.from(set);
  }

  isTagSelected(tag: string) {
    return this.formData.symptomTags.includes(tag);
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym pacjentem.';
      return;
    }
    if (!this.formData.date) {
      this.error = 'Uzupełnij datę.';
      return;
    }

    // Walidacje zakresów (opcjonalne pola tylko jeśli podane)
    if (this.formData.painScore != null && (this.formData.painScore < 0 || this.formData.painScore > 10)) {
      this.error = 'Skala bólu musi mieścić się w zakresie 0–10.';
      return;
    }
    if (this.formData.energy != null && (this.formData.energy < 1 || this.formData.energy > 5)) {
      this.error = 'Energia musi być w zakresie 1–5.';
      return;
    }
    if (this.formData.appetite != null && (this.formData.appetite < 1 || this.formData.appetite > 5)) {
      this.error = 'Apetyt musi być w zakresie 1–5.';
      return;
    }

    const payload = {
      date: this.formData.date,
      symptomTags: this.formData.symptomTags.length ? this.formData.symptomTags : undefined,
      painScore: this.formData.painScore ?? undefined,
      energy: this.formData.energy ?? undefined,
      appetite: this.formData.appetite ?? undefined,
      notes: this.formData.notes || undefined
    };

    this.saving = true;
    this.animals.addSymptom(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Objawy zapisane.';
        this.saving = false;
        this.resetForm();
      },
      error: () => {
        this.error = 'Nie udało się zapisać objawów.';
        this.saving = false;
      }
    });
  }

  private resetForm() {
    this.formData = {
      date: '',
      symptomTags: [],
      painScore: null,
      energy: null,
      appetite: null,
      notes: ''
    };
  }
}
