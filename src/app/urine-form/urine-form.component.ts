import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-urine-form',
  templateUrl: './urine-form.component.html',
  styleUrls: ['./urine-form.component.scss']
})
export class UrineFormComponent {
  animalId: number | null = null;

  formData = {
    physicalChemical: {
      color: '',
      clarity: '',
      specificGravity: '',
      pH: '',
      protein: '',
      glucose: '',
      ketones: '',
      bilirubin: '',
      urobilinogen: '',
      blood: '',
      nitrites: '',
      leukocyteEsterase: ''
    },
    microscopic: {
      wbc: '',
      rbc: '',
      epithelialCells: '',
      crystals: '',
      casts: '',
      bacteria: '',
      yeast: '',
      sperm: '',
      mucus: '',
      parasites: ''
    },
    testDate: '',
    comments: ''
  };

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.animalId = params['animalId'] ? +params['animalId'] : null;
    });
  }

  submitForm() {
    console.log('Submitting urine test for animal ID:', this.animalId);
    console.log('Form data:', this.formData);

    // wysylanie do serwera
  }
}
