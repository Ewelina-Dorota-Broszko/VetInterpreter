import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

@Component({
  selector: 'app-stool-form',
  templateUrl: './stool-form.component.html',
  styleUrls: ['./stool-form.component.scss']
})
export class StoolFormComponent implements OnInit {
  animalId: string | null = null;

  // Listy opcji
  consistencyOptions = [
    { value: 'solid', label: 'Stała' },
    { value: 'soft', label: 'Miękka' },
    { value: 'watery', label: 'Wodnista' }
  ];

  colorOptions = [
    'Brązowy', 'Jasny brązowy', 'Ciemny brązowy',
    'Zielonkawy', 'Żółty', 'Czarny', 'Czerwony'
  ];

  odorOptions = [
    'Prawidłowy', 'Ostry', 'Gnilny', 'Kwaśny', 'Inny'
  ];

  formData = {
    consistency: '',
    color: '',
    mucus: false,
    blood: false,
    odor: '',
    parasites: false,
    comments: '',
    testDate: ''
  };

  saving = false;
  okMsg = '';
  error = '';

  constructor(private route: ActivatedRoute, private animals: AnimalsService) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('animalId');
    if (q) this.animalId = q;
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym pacjentem.';
      return;
    }
    if (!this.formData.testDate) {
      this.error = 'Uzupełnij datę badania.';
      return;
    }

    const payload = {
      date: this.formData.testDate,
      consistency: this.formData.consistency,
      color: this.formData.color,
      mucus: this.formData.mucus,
      blood: this.formData.blood,
      odor: this.formData.odor,
      parasites: this.formData.parasites,
      comments: this.formData.comments
    };

    this.saving = true;
    this.animals.addStoolTest(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Badanie kału zapisane.';
        this.saving = false;
        this.resetForm();
      },
      error: () => {
        this.error = 'Nie udało się zapisać badania.';
        this.saving = false;
      }
    });
  }

  private resetForm() {
    this.formData = {
      consistency: '',
      color: '',
      mucus: false,
      blood: false,
      odor: '',
      parasites: false,
      comments: '',
      testDate: ''
    };
  }
}
