import { Component, OnInit } from '@angular/core';
import { AnimalsService, Animal } from '../services/animals.service';
import { VetService } from '../services/vet.service';
import { AuthService } from '../auth/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

type WorkingHour = {
  day: number; open: boolean; start?: string; end?: string; breakStart?: string; breakEnd?: string;
};

type VetLite = {
  _id: string;
  clinicName: string;
  licenseNo?: string;

  phone?: string;
  email?: string;
  website?: string;

  address?: { line1?: string; line2?: string; city?: string; postalCode?: string; country?: string };
  about?: string;

  acceptsNewPatients?: boolean;
  acceptsEmergency?: boolean;
  emergencyPhone?: string;

  specialties?: string[];
  servicesOffered?: string[];
  languages?: string[];
  paymentMethods?: string[];

  appointmentDurationMin?: number;
  consultPrice?: number;

  workingHours?: WorkingHour[];
};

@Component({
  selector: 'app-my-vet',
  templateUrl: './my-vet.component.html',
  styleUrls: ['./my-vet.component.scss']
})
export class MyVetComponent implements OnInit {
  loading = false;
  error = '';
  ownerId: string | null = null;

  animals: Animal[] = [];
  /** dane wetów po id */
  vets: Record<string, VetLite> = {};
  /** grupowanie: vetId -> lista zwierzaków (+ stan rozwinięcia) */
  byVet: Array<{ vetId: string; vet?: VetLite; animals: Animal[]; expanded?: boolean }> = [];

  unassigning: Record<string, boolean> = {}; // animalId -> loading

  constructor(
    private animalsSvc: AnimalsService,
    private vetSvc: VetService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.error = '';

    const ensureOwnerId$ = this.auth.getOwnerId()
      ? of(this.auth.getOwnerId()!)
      : this.auth.fetchMe().pipe(map(() => this.auth.getOwnerId()!));

    ensureOwnerId$
      .pipe(
        switchMap(ownerId => {
          this.ownerId = ownerId;
          return this.animalsSvc.getForOwner(ownerId);
        }),
        switchMap((animals) => {
          this.animals = animals || [];
          const vetIds = Array.from(
            new Set(this.animals.map(a => (a as any).vetId).filter(Boolean))
          ) as string[];

          if (vetIds.length === 0) return of([] as VetLite[]);

          return forkJoin(
            vetIds.map(id =>
              this.vetSvc.getVetById(id).pipe(catchError(() => of(null)))
            )
          ).pipe(
            map(arr => (arr.filter(Boolean) as any[]).map(v => {
              const vet: VetLite = {
                _id: String(v._id),
                clinicName: v.clinicName,
                licenseNo: v.licenseNo,
                phone: v.phone,
                email: v.email,
                website: v.website,
                address: v.address,
                about: v.about,
                acceptsNewPatients: v.acceptsNewPatients,
                acceptsEmergency: v.acceptsEmergency,
                emergencyPhone: v.emergencyPhone,
                specialties: v.specialties,
                servicesOffered: v.servicesOffered,
                languages: v.languages,
                paymentMethods: v.paymentMethods,
                appointmentDurationMin: v.appointmentDurationMin,
                consultPrice: v.consultPrice,
                workingHours: v.workingHours
              };
              return vet;
            }))
          );
        })
      )
      .subscribe({
        next: (vets) => {
          this.vets = {};
          for (const v of vets) this.vets[v._id] = v;

          const groups = new Map<string, Animal[]>();
          for (const a of this.animals) {
            const vid = (a as any).vetId as string | undefined;
            if (!vid) continue;
            if (!groups.has(vid)) groups.set(vid, []);
            groups.get(vid)!.push(a);
          }

          this.byVet = Array.from(groups.entries()).map(([vetId, animals]) => ({
            vetId,
            vet: this.vets[vetId],
            animals,
            expanded: false
          }));

          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.error || 'Nie udało się pobrać danych.';
          this.loading = false;
        }
      });
  }

  toggleDetails(group: { expanded?: boolean }) {
    group.expanded = !group.expanded;
  }

  openVetProfile(vetId: string) {
    this.router.navigate(['/vet', vetId]);
  }

  unassign(animal: Animal) {
    if (!confirm(`Odpiąć weterynarza od ${animal.name}?`)) return;
    this.unassigning[animal._id] = true;

    this.vetSvc.unassignAnimalFromVet(animal._id).subscribe({
      next: () => {
        (animal as any).vetId = undefined;

        this.byVet = this.byVet
          .map(group => ({
            ...group,
            animals: group.animals.filter(a => a._id !== animal._id)
          }))
          .filter(group => group.animals.length > 0);

        this.unassigning[animal._id] = false;
      },
      error: (e) => {
        alert(e?.error?.error || 'Nie udało się odpiąć.');
        this.unassigning[animal._id] = false;
      }
    });
  }

  findVets() { this.router.navigate(['/find-vet']); }

  dayName(i: number) {
    return ['Pn','Wt','Śr','Cz','Pt','Sb','Nd'][Math.max(0, Math.min(6, i ?? 0))];
  }
}
