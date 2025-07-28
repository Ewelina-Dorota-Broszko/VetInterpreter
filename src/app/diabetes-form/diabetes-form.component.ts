import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-diabetes-form',
  templateUrl: './diabetes-form.component.html',
  styleUrls: ['./diabetes-form.component.scss']
})
export class DiabetesFormComponent {
  animalId: number | null = null;

  formData = {
    date: '',
    time: '',
    glucose: '',
    measurementType: '',
    insulinType: '',
    insulinDose: '',
    comments: ''
  };

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.animalId = params['animalId'] ? +params['animalId'] : null;
    });
  }

  submitForm() {
    console.log('Submitting diabetes log for animal ID:', this.animalId);
    console.log('Form data:', this.formData);
  }
}
