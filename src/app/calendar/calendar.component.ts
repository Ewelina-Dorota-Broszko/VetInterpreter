import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { AnimalsService, Animal } from '../services/animals.service';
import { AuthService } from '../auth/auth.service';
import { VetService } from '../services/vet.service';
import {
  VetPatientsService,
  VetPatientDetail,
  VetPatientRow
} from '../services/vet-patients.service';

import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface NewEventForm {
  date: string;
  title: string;
  note: string;
  animalId?: string; // opisowo
  vetId?: string;    // tylko tryb klienta
  ownerId?: string;  // tryb weta (opcjonalnie, opisowo)
}

interface CalendarEntry {
  _id: string;
  date: string;
  title: string;
  note?: string;
  animalId?: string;
  animalName?: string;
  vetId?: string;
  vetName?: string;
  ownerId?: string;
  ownerName?: string;
}

interface MyVetOption {
  _id: string;
  label: string;     // "Klinika · Miasto"
}

interface ClientLite {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  // tryb
  isVetView = false;
  vetId: string | null = null;
  vetDisplayName: string | null = null;

  // klient (tryb klienta)
  ownerId: string | null = null;

  // dane do formularza
  animals: Animal[] = [];     // (klient) jego zwierzęta
  myVets: MyVetOption[] = []; // (klient) przypięci weci

  // (wet) klienci + zwierzaki (do opisu)
  clients: ClientLite[] = [];
  clientAnimals: Animal[] = [];
  clientQuery = '';
  searchingClients = false;
  clientsError = '';
  showClientDropdown = false;

  // formularz / stan
  showForm = false;
  saving = false;
  loading = false;
  error = '';

  newEvent: NewEventForm = { date: '', title: '', note: '' };

  // kalendarz / widoki
  entries: CalendarEntry[] = [];
  selectedDate: string | null = null;
  entriesForSelectedDate: CalendarEntry[] = [];
  selectedEntry: CalendarEntry | null = null;
  upcoming5: CalendarEntry[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    selectable: true,
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
    dateClick: (arg) => this.onDateClick(arg),
    events: []
  };

  constructor(
    private animalsSvc: AnimalsService,
    private auth: AuthService,
    private vetSvc: VetService,
    private vetPatients: VetPatientsService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      const qp = this.route.snapshot.queryParamMap;
      const urlRole = (qp.get('as') ?? qp.get('role') ?? qp.get('vet') ?? '').toLowerCase();
      const forceVet = ['vet', '1', 'true', 'yes'].includes(urlRole);

      const vetProfile = await this.tryGetVetProfile();

      if (forceVet || vetProfile) {
        // ===== TRYB WETA =====
        this.isVetView = true;
        if (vetProfile) {
          this.vetId = String(vetProfile._id ?? vetProfile.id ?? '');
          this.vetDisplayName = [vetProfile.clinicName, vetProfile.address?.city]
            .filter(Boolean).join(' · ') || 'Weterynarz';
        }
        await this.loadVetCalendar(); // tylko vet
        this.computeUpcoming5();

      } else {
        // ===== TRYB KLIENTA =====
        this.ownerId = this.auth.getOwnerId?.() || null;
        if (!this.ownerId) {
          await new Promise<void>((resolve, reject) => {
            this.auth.fetchMe().subscribe({ next: () => resolve(), error: reject });
          });
          this.ownerId = this.auth.getOwnerId?.() || null;
        }
        if (!this.ownerId) { this.error = 'Brak ownerId (zaloguj się).'; return; }

        await Promise.all([
          this.loadAnimalsForOwner(this.ownerId),
          this.loadOwnerCalendar(this.ownerId)
        ]);
        await this.loadMyVets();
        this.computeUpcoming5();
      }
    } catch (e: any) {
      console.error(e);
      this.error = e?.error?.error || 'Nie udało się pobrać danych.';
    }
  }

  /** Spróbuj pobrać profil weta */
  private tryGetVetProfile(): Promise<any | null> {
    const obs =
      (this.vetSvc as any).getMyProfile?.() ??
      (this.vetSvc as any).getMe?.();

    if (!obs) return Promise.resolve(null);
    return new Promise(resolve => {
      (obs as any).pipe(catchError(() => of(null))).subscribe((res: any) => {
        if (res && (res._id || res.id)) resolve(res);
        else resolve(null);
      });
    });
  }

  /* ================== LOADERS ================== */

  // KALENDARZ KLIENTA
  private loadOwnerCalendar(ownerId: string): Promise<void> {
    this.loading = true; this.error = '';
    return new Promise((resolve, reject) => {
      this.animalsSvc.getOwnerCalendar(ownerId).subscribe({
        next: (list) => {
          this.entries = (list || []).map((e: any) => ({
            _id: String(e._id ?? cryptoRandomId()),
            date: e.date,
            title: e.title ?? 'Wydarzenie',
            note: e.note,
            animalId: e.animalId,
            animalName: e.animalName,
            vetId: e.vetId,
            vetName: e.vetName
          }));
          this.applyEventsToCalendar(); this.refreshSelectedDateList();
          this.loading = false; resolve();
        },
        error: (err) => { this.error = err?.error?.error || 'Nie udało się pobrać kalendarza.'; this.loading = false; reject(err); }
      });
    });
  }

  // KALENDARZ WETA — tylko przez VetService smart
  private async loadVetCalendar(): Promise<void> {
    this.loading = true; this.error = '';
    try {
      const list = await this.vetSvc.getVetCalendarSmart(this.vetId || undefined);
      this.entries = (list || []).map((e: any) => ({
        _id: String(e._id ?? cryptoRandomId()),
        date: e.date,
        title: e.title ?? 'Wydarzenie',
        note: e.note,
        ownerId: e.ownerId,
        ownerName: e.ownerName,
        animalId: e.animalId,
        animalName: e.animalName,
        vetId: e.vetId ?? this.vetId ?? undefined,
        vetName: e.vetName ?? this.vetDisplayName ?? undefined
      }));
      this.applyEventsToCalendar();
      this.refreshSelectedDateList();
    } catch (err: any) {
      this.error = err?.message || 'Nie udało się pobrać kalendarza weta.';
    } finally {
      this.loading = false;
    }
  }

  private loadAnimalsForOwner(ownerId: string, quiet = false): Promise<void> {
    if (!quiet) this.loading = true;
    return new Promise((resolve) => {
      this.animalsSvc.getForOwner(ownerId).subscribe({
        next: (list) => { this.animals = list || []; if (!quiet) this.loading = false; resolve(); },
        error: () => { this.animals = []; if (!quiet) this.loading = false; resolve(); }
      });
    });
  }

  // ===== (KLIENT) — przypięci weci z vetId w zwierzakach =====
  private loadMyVets(): Promise<void> {
    const vetIds = Array.from(
      new Set((this.animals || []).map(a => (a as any).vetId).filter(Boolean))
    ) as string[];

    if (!vetIds.length) { this.myVets = []; return Promise.resolve(); }

    return new Promise((resolve) => {
      forkJoin(
        vetIds.map(id =>
          (this.vetSvc as any).getVetById?.(id)?.pipe(catchError(() => of(null))) ?? of(null)
        )
      ).subscribe({
        next: (arr) => {
          const vets = (arr.filter(Boolean) as any[]);
          this.myVets = vets.map(v => ({
            _id: String(v._id),
            label: [v.clinicName, v.address?.city].filter(Boolean).join(' · ') || 'Weterynarz'
          }));
          resolve();
        },
        error: () => { this.myVets = []; resolve(); }
      });
    });
  }

  /* ================== WYSZUKIWANIE KLIENTÓW (WET – opisowo) ================== */

  onClientQuery(): void {
    this.clientsError = '';
    const q = (this.clientQuery || '').trim();

    this.showClientDropdown = q.length >= 2;

    if (q.length < 2) { this.clients = []; return; }

    this.searchingClients = true;

    (this.vetSvc as any).getPatients(q).pipe(catchError(() => of([]))).subscribe({
      next: (rows: any[]) => {
        this.clients = (rows || []).map((r: any) => ({
          _id: String(r._id ?? r.owner?._id ?? r.id ?? ''),
          name:
            r.name ||
            r.owner?.name ||
            [r.firstName, r.lastName].filter(Boolean).join(' ').trim() ||
            r.email || r.owner?.email ||
            r.phone || r.owner?.phone ||
            'Klient'
        }));
        this.searchingClients = false;
      },
      error: () => {
        this.searchingClients = false;
        this.clientsError = 'Nie udało się wyszukać klientów.';
        this.clients = [];
      }
    });
  }

  loadAllClients(): void {
    this.clientsError = '';
    this.searchingClients = true;
    (this.vetSvc as any).getPatients('').pipe(catchError(() => of([]))).subscribe({
      next: (rows: any[]) => {
        this.clients = (rows || []).map((r: any) => ({
          _id: String(r._id ?? r.owner?._id ?? r.id ?? ''),
          name: r.name || r.owner?.name || r.email || r.owner?.email || r.phone || r.owner?.phone || 'Klient'
        }));
        this.clientQuery = '';
        this.showClientDropdown = true;
        this.searchingClients = false;
      },
      error: () => {
        this.searchingClients = false;
        this.clientsError = 'Backend nie wspiera listy wszystkich klientów.';
      }
    });
  }
  // ——— link do pacjenta (klienta)
  openOwner(ownerId?: string, ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();
    if (!ownerId) return;
    this.router.navigate(['/vet/patient', ownerId]);
  }

  // ——— link do zwierzaka
  openAnimal(animalId?: string, ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();
    if (!animalId) return;
    this.router.navigate(['/vet/animal', animalId]);
  }

  onSelectClient(c: ClientLite) {
    this.newEvent.ownerId = c._id;
    this.clientQuery = c.name;
    this.showClientDropdown = false;
    this.loadClientAnimals(c._id);
    this.newEvent.animalId = undefined;
  }

  private loadClientAnimals(ownerId: string): Promise<void> {
    return new Promise((resolve) => {
      this.vetPatients.getPatient(ownerId).pipe(catchError(() => of(null))).subscribe({
        next: (detail: VetPatientDetail | null) => {
          this.clientAnimals = detail?.animals as any[] || [];
          resolve();
        },
        error: () => { this.clientAnimals = []; resolve(); }
      });
    });
  }

  /* ================== FORM / AKCJE ================== */

  openForm(): void {
    this.showForm = true;
    this.error = '';
    this.newEvent = { date: this.selectedDate || this.today(), title: '', note: '' };
    this.clientAnimals = [];
    this.clientsError = '';
  }

  cancelForm(): void {
    this.showForm = false;
    this.error = '';
    this.resetForm();
  }

  onFormOwnerChange(): void {
    if (this.isVetView && this.newEvent.ownerId) {
      this.loadClientAnimals(this.newEvent.ownerId);
      this.newEvent.animalId = undefined;
    } else {
      this.clientAnimals = [];
      this.newEvent.animalId = undefined;
    }
  }

  submitForm(): void {
    const { date, title, note, animalId } = this.newEvent;
    if (!date || !title?.trim()) { this.error = 'Uzupełnij datę i tytuł.'; return; }

    this.saving = true;

    if (this.isVetView) {
      // ===== Zapis TYLKO do kalendarza weta (przez smart API w VetService) =====
      const ownerId = this.newEvent.ownerId;
      const ownerName = ownerId ? (this.clients.find(c => c._id === ownerId)?.name || undefined) : undefined;

      const animalName = animalId
        ? (this.clientAnimals.find(a => a._id === animalId)?.name || undefined)
        : undefined;

      const payload: any = {
        date,
        title: title.trim(),
        note: note?.trim() || undefined,
        ownerId,
        ownerName,
        animalId,
        animalName
      };

      this.vetSvc.addVetCalendarEventSmart(payload, this.vetId || undefined)
        .then((created: any) => {
          const entry: CalendarEntry = {
            _id: String(created._id || cryptoRandomId()),
            date: created.date ?? date,
            title: created.title ?? title.trim(),
            note: created.note ?? (note?.trim() || undefined),
            ownerId: created.ownerId ?? ownerId,
            ownerName: created.ownerName ?? ownerName,
            animalId: created.animalId ?? animalId,
            animalName: created.animalName ?? animalName,
            vetId: created.vetId ?? this.vetId ?? undefined,
            vetName: created.vetName ?? this.vetDisplayName ?? undefined
          };
          this.afterCreate(entry);
        })
        .catch((err) => { this.error = err?.message || 'Nie udało się dodać wydarzenia (wet).'; })
        .finally(() => { this.saving = false; });

    } else {
      // ===== tryb klienta — bez zmian (zapis do kalendarza właściciela) =====
      const ownerId = this.ownerId!;
      const animalName = animalId ? (this.animals.find(a => a._id === animalId)?.name || undefined) : undefined;

      const vetId = this.newEvent.vetId;
      const vetName = vetId ? (this.myVets.find(v => v._id === vetId)?.label || undefined) : undefined;

      this.animalsSvc.addOwnerCalendarEvent(ownerId, {
        date,
        title: title.trim(),
        note: note?.trim() || undefined,
        animalId,
        animalName,
        vetId,
        vetName
      }).subscribe({
        next: (created) => {
          const entry: CalendarEntry = {
            _id: String(created?._id || cryptoRandomId()),
            date: created?.date ?? date,
            title: created?.title ?? title.trim(),
            note: created?.note ?? (note?.trim() || undefined),
            animalId: created?.animalId ?? animalId,
            animalName: created?.animalName ?? animalName,
            vetId: created?.vetId ?? vetId,
            vetName: created?.vetName ?? vetName
          };
          this.afterCreate(entry);
          this.saving = false;
        },
        error: (err) => { this.error = err?.error?.error || 'Nie udało się dodać wydarzenia.'; this.saving = false; }
      });
    }
  }

  deleteEntry(entry: CalendarEntry): void {
    if (!confirm('Usunąć to wydarzenie?')) return;

    if (this.isVetView) {
      this.vetSvc.deleteVetCalendarEventSmart(entry._id, this.vetId || undefined)
        .then(() => this.afterDelete(entry))
        .catch((err) => this.error = err?.message || 'Nie udało się usunąć wydarzenia (wet).');
      return;
    }

    // tryb klienta – bez zmian
    if (!this.ownerId) return;
    this.animalsSvc.deleteOwnerCalendarEvent(this.ownerId, entry._id).subscribe({
      next: () => this.afterDelete(entry),
      error: (err) => this.error = err?.error?.error || 'Nie udało się usunąć wydarzenia.'
    });
  }

  private afterCreate(entry: CalendarEntry) {
    this.entries.push(entry);
    this.selectedDate = entry.date;
    this.applyEventsToCalendar();
    this.refreshSelectedDateList();
    this.computeUpcoming5();
    this.showForm = false;
    this.resetForm();
  }

  private afterDelete(entry: CalendarEntry) {
    this.entries = this.entries.filter(e => e._id !== entry._id);
    this.applyEventsToCalendar();
    this.refreshSelectedDateList();
    this.computeUpcoming5();
  }

  /* ================== KALENDARZ / WIDOK ================== */

  private applyEventsToCalendar(): void {
    const events = this.entries.map(e => {
      const parts: string[] = [e.title];
      if (this.isVetView) {
        if (e.ownerName) parts.push(e.ownerName);
        if (e.animalName) parts.push(e.animalName);
      } else {
        if (e.animalName) parts.push(e.animalName);
        if (e.vetName) parts.push(e.vetName);
      }
      return { id: e._id, title: parts.join(' — '), start: e.date };
    });
    this.calendarOptions = { ...this.calendarOptions, events };
  }

  private onDateClick(arg: any): void {
    this.selectedDate = arg.dateStr;
    this.selectedEntry = null;
    this.refreshSelectedDateList();
    if (!this.showForm) this.newEvent.date = arg.dateStr;
  }

  private refreshSelectedDateList(): void {
    if (!this.selectedDate) { this.entriesForSelectedDate = []; return; }
    this.entriesForSelectedDate = this.entries
      .filter(e => e.date === this.selectedDate)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  selectEntry(e: CalendarEntry): void { this.selectedEntry = e; }

  private computeUpcoming5(): void {
    const todayStr = this.today();
    this.upcoming5 = [...this.entries]
      .filter(e => e.date >= todayStr)
      .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
      .slice(0, 5);
  }

  private resetForm(): void {
    this.newEvent = { date: this.selectedDate ?? '', title: '', note: '' };
    this.clientAnimals = [];
  }

  private today(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }
}

/** prościutki lokalny ID gdy backend nie zwraca _id */
function cryptoRandomId(): string {
  try {
    const b = new Uint8Array(12);
    crypto.getRandomValues(b);
    return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
  } catch { return String(Date.now()) + Math.random().toString(16).slice(2); }
}
