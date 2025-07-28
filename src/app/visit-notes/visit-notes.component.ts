import { Component } from '@angular/core';

@Component({
  selector: 'app-visit-notes',
  templateUrl: './visit-notes.component.html',
  styleUrls: ['./visit-notes.component.scss']
})
export class VisitNotesComponent {
  formData = {
    visitDate: '',
    clinicName: '',
    vetName: '',
    vaccinations: false,
    symptoms: '',
    treatments: '',
    medications: [
      { name: '', dosage: '', frequency: '' }
    ],
    notes: '',
    nextVisitDate: ''
  };

  addMedication() {
    this.formData.medications.push({ name: '', dosage: '', frequency: '' });
  }

  submitForm() {
    console.log('Visit record:', this.formData);
    // tutaj można dodać logikę zapisu do API lub lokalnie
  }
}
