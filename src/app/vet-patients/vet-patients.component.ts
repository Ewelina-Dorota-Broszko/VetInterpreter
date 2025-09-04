import { Component, OnInit } from '@angular/core';
import { VetService } from '../services/vet.service';

@Component({
  selector: 'app-vet-patients',
  templateUrl: './vet-patients.component.html',
  styleUrls: ['./vet-patients.component.scss']
})
export class VetPatientsComponent implements OnInit {
  search = '';
  loading = false;
  error = '';
  patients: any[] = [];

  constructor(private vetSvc: VetService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.vetSvc.getPatients(this.search).subscribe({
      next: res => {
        this.patients = res;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.error || 'Nie udało się pobrać pacjentów.';
        this.loading = false;
      }
    });
  }

  searchPatients() {
    this.load();
  }
}
