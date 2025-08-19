import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

@Component({
  selector: 'app-meds-form',
  templateUrl: './meds-form.component.html',
  styleUrls: ['./meds-form.component.scss']
})
export class MedsFormComponent implements OnInit {
  animalId: string | null = null;

  formData = {
    name: '',
    dose: '',
    frequency: '',
    timesOfDay: [] as string[],
    startDate: '',
    endDate: '',
    isActive: true,
    notes: ''
  };

  saving = false;
  okMsg = '';
  error = '';

  // dostępne godziny dawkowania
  timesOptions = ['Rano', 'Południe', 'Wieczór', 'Noc'];

  constructor(private route: ActivatedRoute, private animals: AnimalsService) {}

  ngOnInit(): void {
    this.animalId = this.route.snapshot.queryParamMap.get('animalId');
  }

  toggleTime(t: string) {
    const arr = this.formData.timesOfDay;
    this.formData.timesOfDay = arr.includes(t)
      ? arr.filter(x => x !== t)
      : [...arr, t];
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym pacjentem.';
      return;
    }
    if (!this.formData.name || !this.formData.dose || !this.formData.startDate) {
      this.error = 'Uzupełnij nazwę, dawkę i datę rozpoczęcia.';
      return;
    }

    const payload = { ...this.formData };

    this.saving = true;
    this.animals.addMedication(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Lek zapisany.';
        this.saving = false;
        this.resetForm();
      },
      error: () => {
        this.error = 'Nie udało się zapisać leku.';
        this.saving = false;
      }
    });
  }

  private resetForm() {
    this.formData = {
      name: '',
      dose: '',
      frequency: '',
      timesOfDay: [],
      startDate: '',
      endDate: '',
      isActive: true,
      notes: ''
    };
  }
}
