import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

@Component({
  selector: 'app-weight-form',
  templateUrl: './weight-form.component.html',
  styleUrls: ['./weight-form.component.scss']
})
export class WeightFormComponent implements OnInit {
  animalId?: string;

  // lista gotowych opcji dla BCS (1–9)
  bcsOptions = Array.from({ length: 9 }, (_, i) => i + 1);

  formData = {
    date: '',
    weightKg: '',
    bcs: '',
    note: ''
  };

  saving = false;
  okMsg = '';
  error = '';

  constructor(private route: ActivatedRoute, private animals: AnimalsService) {}

  ngOnInit(): void {
    this.animalId = this.route.snapshot.queryParamMap.get('animalId') || undefined;
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym pacjentem.';
      return;
    }
    if (!this.formData.date || !this.formData.weightKg) {
      this.error = 'Uzupełnij datę i wagę.';
      return;
    }

    const payload = {
      date: this.formData.date,
      weightKg: Number(this.formData.weightKg),
      bcs: this.formData.bcs ? Number(this.formData.bcs) : undefined,
      note: this.formData.note || ''
    };

    this.saving = true;
    this.animals.addWeight(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Wpis wagi zapisany.';
        this.saving = false;
        this.resetForm();
      },
      error: () => {
        this.error = 'Nie udało się zapisać wpisu.';
        this.saving = false;
      }
    });
  }

  private resetForm() {
    this.formData = {
      date: '',
      weightKg: '',
      bcs: '',
      note: ''
    };
  }
}
