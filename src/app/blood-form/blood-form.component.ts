import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-blood-form',
  templateUrl: './blood-form.component.html',
  styleUrls: ['./blood-form.component.scss']
})
export class BloodFormComponent {
  animalId: number | null = null;

  formData = {
    morphology: {
      hemoglobin: '',
      rbc: '',
      wbc: '',
      hematocrit: '',
      platelets: '',
      mcv: '',
      mch: '',
      mchc: ''
    },
    biochemistry: {
      glucose: '',
      urea: '',
      creatinine: '',
      alt: '',
      ast: '',
      alp: '',
      totalProtein: '',
      albumin: '',
      globulin: '',
      bilirubinTotal: '',
      bilirubinDirect: '',
      bilirubinIndirect: ''
    },
    other: {
      comments: '',
      testDate: ''
    }
  };

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.animalId = params['animalId'] ? +params['animalId'] : null;
    });
  }

  submitForm() {
    console.log('Submitting blood test for animal ID:', this.animalId);
    console.log('Form data:', this.formData);

    //wysylanie do serwera na kiedys
  }
}
