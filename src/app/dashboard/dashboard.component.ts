import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { AnimalsService, Animal } from '../services/animals.service';
import { VetService } from '../services/vet.service';

type CalendarEvent = {
  _id?: string;
  date: string;       // YYYY-MM-DD
  title: string;
  note?: string;
  animalId?: string;
};

type VetLite = {
  _id: string;
  clinicName: string;
  vetName?: string;                 // z backendu (virtual) lub z userId.name
  address?: { city?: string };
  phone?: string;
  email?: string;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  loading = false;
  error = '';

  ownerId: string | null = null;

  // źródła
  animals: (Animal & { vetId?: string })[] = [];
  calendar: CalendarEvent[] = [];

  // sekcje
  upcoming: CalendarEvent[] = []; // 7 najbliższych
  medsToday: Array<{ animalName: string; medication: any; timeLabel: string }> = [];
  vaccSoon: Array<{ animalName: string; v: any; daysLeft: number }> = [];
  latestResults: Array<{
    animalId: string;
    animalName: string;
    blood?: any;
    urine?: any;
    temperature?: any;
    weight?: any;
  }> = [];
  myVets: VetLite[] = [];

  today = this.toDateString(new Date());

  constructor(
    private auth: AuthService,
    private animalsSvc: AnimalsService,
    private vetSvc: VetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.loading = true;
    this.error = '';

    const ensureOwnerId$ = this.auth.getOwnerId()
      ? of(this.auth.getOwnerId()!)
      : this.auth.fetchMe().pipe(map(() => this.auth.getOwnerId()!));

    ensureOwnerId$
      .pipe(
        switchMap(ownerId => {
          this.ownerId = ownerId;
          return forkJoin([
            this.animalsSvc.getForOwner(ownerId).pipe(catchError(() => of([] as Animal[]))),
            // jeśli u Ciebie endpoint jest pod /animals/owners/:id/calendar — użyj metody z serwisu
            this.animalsSvc.getOwnerCalendar(ownerId).pipe(catchError(() => of([] as any[])))
          ]);
        })
      )
      .subscribe({
        next: ([animals, calendar]) => {
          // normalizacja vetId => string
          this.animals = (animals || []).map(a => {
            const any = a as any;
            const normVetId = any?.vetId != null ? String(any.vetId) : undefined;
            return { ...a, vetId: normVetId };
          });

          this.calendar = (calendar || []).map((e: any) => ({
            _id: e._id,
            date: e.date,
            title: e.title || e.note || 'Wydarzenie',
            note: e.note || '',
            animalId: e.animalId
          }));

          this.computeUpcoming();
          this.computeMedsToday();
          this.computeVaccinationsSoon();
          this.computeLatestResults();
          this.loadMyVets();

          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Nie udało się załadować danych.';
          this.loading = false;
        }
      });
  }

  /* ============== Sekcje ============== */

  private computeUpcoming() {
    const today = this.today;
    this.upcoming = [...this.calendar]
      .filter(e => e.date >= today)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 7);
  }

  private computeMedsToday() {
    const out: Array<{ animalName: string; medication: any; timeLabel: string }> = [];
    for (const a of this.animals) {
      const meds = (a as any).medications || [];
      for (const m of meds) {
        if (!m?.isActive) continue;
        const times: string[] = m.timesOfDay || [];
        for (const t of times) {
          out.push({
            animalName: (a as any).name,
            medication: m,
            timeLabel: t
          });
        }
      }
    }
    this.medsToday = out.sort((x, y) => (x.timeLabel > y.timeLabel ? 1 : x.timeLabel < y.timeLabel ? -1 : (x.animalName > y.animalName ? 1 : -1)));
  }

  private computeVaccinationsSoon() {
    const out: Array<{ animalName: string; v: any; daysLeft: number }> = [];
    const now = new Date();
    for (const a of this.animals) {
      const vaccs = (a as any).vaccinations || [];
      for (const v of vaccs) {
        if (!v?.nextDueDate) continue;
        const due = new Date(v.nextDueDate);
        const daysLeft = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          out.push({ animalName: (a as any).name, v, daysLeft });
        }
      }
    }
    this.vaccSoon = out.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10);
  }

  private computeLatestResults() {
    const latestOf = <T extends { date: string }>(arr: T[] | undefined) => {
      if (!arr?.length) return undefined;
      return [...arr].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    };

    this.latestResults = this.animals.map(a => {
      const blood = latestOf((a as any).bloodTests);
      const urine = latestOf((a as any).urineTests);
      const temperature = latestOf((a as any).temperatureLogs);
      const weight = latestOf((a as any).weightHistory);
      return {
        animalId: (a as any)._id,
        animalName: (a as any).name,
        blood, urine, temperature, weight
      };
    }).filter(card => card.blood || card.urine || card.temperature || card.weight).slice(0, 6);
  }

  private loadMyVets() {
    const vetIds = Array.from(new Set(this.animals.map(a => (a as any).vetId).filter(Boolean))) as string[];
    if (!vetIds.length) { this.myVets = []; return; }

    forkJoin(
      vetIds.map(id => this.vetSvc.getVetById(id).pipe(catchError(() => of(null))))
    ).subscribe({
      next: (arr) => {
        this.myVets = (arr.filter(Boolean) as any[]).map(v => ({
          _id: String(v._id),
          clinicName: v.clinicName,
          vetName: v.vetName || v.userId?.name || v.userId?.fullName
            || [v.userId?.firstName, v.userId?.lastName].filter(Boolean).join(' ').trim(),
          address: v.address,
          phone: v.phone,
          email: v.email
        }));
      },
      error: () => { this.myVets = []; }
    });
  }

  /* ============== Akcje / nawigacja ============== */

  openCalendar() {
    this.router.navigate(['/calendar']);
  }

  openAnimal(animalId: string) {
    this.router.navigate(['/animal', animalId]);
  }

  openVet(vetId: string) {
    this.router.navigate(['/vet', vetId]);
  }

  /* ============== Utils / widok ============== */

  badgeClassForVacc(daysLeft: number) {
    if (daysLeft < 0) return 'badge danger';
    if (daysLeft <= 7) return 'badge warn';
    return 'badge ok';
  }

  toDateString(d: Date) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  trackEvent = (_: number, e: CalendarEvent) => e._id || `${e.date}-${e.title}`;
  trackVet   = (_: number, v: VetLite) => v._id;
}
