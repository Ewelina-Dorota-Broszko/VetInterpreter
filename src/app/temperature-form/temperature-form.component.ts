import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-temperature-form',
  templateUrl: './temperature-form.component.html',
  styleUrls: ['./temperature-form.component.scss']
})
export class TemperatureFormComponent {
  animalId: number | null = null;

  formData = {
    date: '',
    time: '',
    temperature: '',
    behavior: '',
    appetite: '',
    comments: ''
  };

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.animalId = params['animalId'] ? +params['animalId'] : null;
    });
  }

  submitForm() {
    console.log('Submitting temperature record for animal ID:', this.animalId);
    console.log('Form data:', this.formData);

    // wysyalnie na serwer
  }
}
