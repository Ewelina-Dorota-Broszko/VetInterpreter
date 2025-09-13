import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VetService } from '../services/vet.service';

@Component({
  selector: 'app-vet-patient-profile',
  templateUrl: './vet-patient-profile.component.html',
  styleUrls: ['./vet-patient-profile.component.scss']
})
export class VetPatientProfileComponent implements OnInit {
  loading = false;
  error = '';
  data: { owner: any; animals: any[] } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vetSvc: VetService
  ) {}

  ngOnInit(): void {
    const ownerId = this.route.snapshot.paramMap.get('ownerId');
    if (ownerId) {
      this.fetch(ownerId);
    }
  }

  fetch(ownerId: string) {
    this.loading = true;
    this.error = '';
    this.vetSvc.getPatientDetails(ownerId).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.error || 'Nie udało się pobrać danych pacjenta';
        this.loading = false;
      }
    });
  }

  openAnimal(animalId: string) {
    this.router.navigate(['/vet/animal', animalId]);
  }

  // skróty do dodawania badań → przekierowanie do formularzy
  addBlood(animalId: string) {
    this.router.navigate(['/add-document'], { queryParams: { animalId, type: 'blood' } });
  }
  addUrine(animalId: string) {
    this.router.navigate(['/add-document'], { queryParams: { animalId, type: 'urine' } });
  }
  addTemp(animalId: string) {
    this.router.navigate(['/add-document'], { queryParams: { animalId, type: 'temperature' } });
  }
  addWeight(animalId: string) {
    this.router.navigate(['/add-document'], { queryParams: { animalId, type: 'weight' } });
  }
  addVacc(animalId: string) {
    this.router.navigate(['/add-document'], { queryParams: { animalId, type: 'vaccination' } });
  }
}
