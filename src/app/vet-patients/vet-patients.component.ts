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
      next: (res: any) => {
        // 🔹 Obsłuż dowolny kształt danych
        const data: any[] = Array.isArray(res)
          ? res
          : (res?.rows ?? res?.data ?? res ?? []);

        // 🔹 Filtr: usuń wszystko co ma w nazwie/emailu/roli "admin"
        this.patients = data.filter((p: any) => {
          const name = (p.name || '').toLowerCase();
          const email = (p.email || '').toLowerCase();
          const role = (p.role || '').toLowerCase();

          return !(
            name.includes('admin') ||
            email.includes('admin') ||
            role.includes('admin')
          );
        });

        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.error || 'Nie udało się pobrać pacjentów.';
        this.loading = false;
      }
    });
  }

  searchPatients() {
    this.load();
  }
}
