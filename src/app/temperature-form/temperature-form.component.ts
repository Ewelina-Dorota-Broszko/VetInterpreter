import { Component, Input, OnInit } from '@angular/core';
import { AnimalsService } from '../services/animals.service';
import { ActivatedRoute } from '@angular/router';

export interface TemperatureLog {
  date: string;
  time: string;
  temperature: number;
  behavior?: 'normal' | 'lethargic' | 'agitated' | 'unresponsive' | '';
  appetite?: 'normal' | 'reduced' | 'none' | '';
  comments?: string;
}

@Component({
  selector: 'app-temperature-form',
  templateUrl: './temperature-form.component.html',
  styleUrls: ['./temperature-form.component.scss']
})
export class TemperatureFormComponent implements OnInit {
  @Input() animalId?: string; // może przyjść z rodzica, ale nie musi

  form: TemperatureLog = this.newForm();
  saving = false;
  error = '';
  okMsg = '';

  constructor(private animals: AnimalsService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // 1) spróbuj z query param ?animalId=...
    if (!this.animalId) {
      const qp = this.route.snapshot.queryParamMap;
      const fromQuery = qp.get('animalId');
      if (fromQuery) this.animalId = fromQuery;
    }

    // 2) alternatywnie ze ścieżki /animals/:animalId/form/temperature
    if (!this.animalId) {
      const p = this.route.snapshot.paramMap;
      const fromPath = p.get('animalId');
      if (fromPath) this.animalId = fromPath;
    }
  }

  private newForm(): TemperatureLog {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const MM = String(now.getMinutes()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${HH}:${MM}`,
      temperature: NaN,
      behavior: '',
      appetite: '',
      comments: ''
    };
  }

  submitForm() {
    this.error = '';
    this.okMsg = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym zwierzęciem.';
      return;
    }
    if (!this.form.date || !this.form.time || isNaN(this.form.temperature)) {
      this.error = 'Uzupełnij datę, godzinę i temperaturę.';
      return;
    }

    this.saving = true;
    this.animals.addTemperature(this.animalId, this.form).subscribe({
      next: () => {
        this.okMsg = 'Pomiar zapisany!';
        this.form = this.newForm();
        this.saving = false;
      },
      error: () => {
        this.error = 'Nie udało się zapisać.';
        this.saving = false;
      }
    });
  }
}
