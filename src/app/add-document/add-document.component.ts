import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss'] // ← TU dodajesz link do SCSS
})
export class AddDocumentComponent {
  animals = [
    { id: 1, name: 'Rex' },
    { id: 2, name: 'Mittens' }
  ];

  selectedAnimal = 1;
  selectedType = 'blood';

  constructor(private router: Router) {}

  navigateToForm() {
    this.router.navigate([`/form/${this.selectedType}`], {
      queryParams: { animalId: this.selectedAnimal }
    });
  }
}
