import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  constructor(private router: Router) { }

  pets = 0;
  blood_tests = 0;
  general_examinations = 0;
  notes = 0;
  isLogin = false;

  ngOnInit(): void {}

  animals = [
    { id: 1, name: 'Max' },
    { id: 2, name: 'Rex' }
  ];

  // --- Nawigacja główna ---
  goToDashboard() { this.router.navigate(['/dashboard']); }
  goToCalendar()  { this.router.navigate(['/calendar']); }
  goToDocuments() { this.router.navigate(['/documents']); }

  // --- Zwierzęta ---
  selectAnimal(animal: any) {
    this.router.navigate(['/animal', animal.id]);
  }

  // --- Dokumenty (dodawanie) ---
  goToAddDocument() {
    this.router.navigate(['/add-document']);
  }

  // pomocniczo dla *ngFor
  trackById = (_: number, a: any) => a.id;
}
