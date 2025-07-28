import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-stool-form',
  templateUrl: './stool-form.component.html',
  styleUrls: ['./stool-form.component.scss']
})
export class StoolFormComponent {
  animalId: number | null = null;

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

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.animalId = params['animalId'] ? +params['animalId'] : null;
    });
  }

  submitForm() {
    console.log('Submitting stool test for animal ID:', this.animalId);
    console.log('Form data:', this.formData);

    //serwer wysylanie
  }
}
