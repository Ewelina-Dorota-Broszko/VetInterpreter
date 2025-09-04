// src/app/calendar/calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AnimalsService, Animal } from '../services/animals.service';
import { AuthService } from '../auth/auth.service';

interface NewEventForm {
  date: string;
  title: string;
  note: string;
  animalId?: string; // opcjonalnie
}

interface CalendarEntry {
  _id: string;
  date: string;
  title: string;
  note?: string;
  animalId?: string;
  animalName?: string;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  loading = false;
  saving = false;
  error = '';

  ownerId: string | null = null;
  animals: Animal[] = [];

  selectedDate: string | null = null;
  showForm = false;

  newEvent: NewEventForm = { date: '', title: '', note: '' };
  entries: CalendarEntry[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    selectable: true,
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
    dateClick: (arg) => this.onDateClick(arg),
    events: [] // <- będziemy nadpisywać tablicą zdarzeń po każdym load/submit/delete
  };

  constructor(
    private animalsSvc: AnimalsService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // 1) ownerId
      this.ownerId = this.auth.getOwnerId?.() || null;
      if (!this.ownerId) {
        await new Promise<void>((resolve, reject) => {
          this.auth.fetchMe().subscribe({ next: () => resolve(), error: reject });
        });
        this.ownerId = this.auth.getOwnerId?.() || null;
      }
      if (!this.ownerId) {
        this.error = 'Brak ownerId (zaloguj się).';
        return;
      }

      // 2) równolegle: lista zwierzaków (do selecta) + wpisy kalendarza
      await Promise.all([this.loadAnimalsForOwner(this.ownerId), this.loadOwnerCalendar(this.ownerId)]);
    } catch (e: any) {
      this.error = e?.error?.error || 'Nie udało się pobrać danych.';
    }
  }

  private loadOwnerCalendar(ownerId: string): Promise<void> {
    this.loading = true;
    this.error = '';
    return new Promise((resolve, reject) => {
      this.animalsSvc.getOwnerCalendar(ownerId).subscribe({
        next: (list) => {
          this.entries = (list || []).map((e: any) => ({
            _id: String(e._id),
            date: e.date,
            title: e.title ?? 'Wydarzenie',
            note: e.note,
            animalId: e.animalId,
            animalName: e.animalName
          }));
          this.applyEventsToCalendar();
          this.loading = false;
          resolve();
        },
        error: (err) => {
          this.error = err?.error?.error || 'Nie udało się pobrać kalendarza.';
          this.loading = false;
          reject(err);
        }
      });
    });
  }

  private loadAnimalsForOwner(ownerId: string): Promise<void> {
    return new Promise((resolve) => {
      this.animalsSvc.getForOwner(ownerId).subscribe({
        next: (list) => { this.animals = list || []; resolve(); },
        error: () => resolve()
      });
    });
  }

  openForm(): void {
    this.showForm = true;
    this.error = '';
    this.newEvent.date = this.selectedDate || this.today();
  }

  cancelForm(): void {
    this.showForm = false;
    this.error = '';
    this.resetForm();
  }

  submitForm(): void {
    if (!this.ownerId) { this.error = 'Brak ownerId.'; return; }
    const { date, title, note, animalId } = this.newEvent;
    if (!date || !title?.trim()) { this.error = 'Uzupełnij datę i tytuł.'; return; }

    this.saving = true;
    const animalName = animalId ? (this.animals.find(a => a._id === animalId)?.name || undefined) : undefined;

    this.animalsSvc.addOwnerCalendarEvent(this.ownerId, {
      date,
      title: title.trim(),
      note: note?.trim() || undefined,
      animalId,
      animalName
    }).subscribe({
      next: (created) => {
        const entry: CalendarEntry = {
          _id: String(created._id),
          date: created.date ?? date,
          title: created.title ?? title.trim(),
          note: created.note ?? (note?.trim() || undefined),
          animalId: created.animalId ?? animalId,
          animalName: created.animalName ?? animalName
        };
        this.entries.push(entry);
        this.selectedDate = entry.date;
        this.applyEventsToCalendar();
        this.showForm = false;
        this.resetForm();
        this.saving = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się dodać wydarzenia.';
        this.saving = false;
      }
    });
  }

  deleteEntry(entry: CalendarEntry): void {
    if (!this.ownerId) return;
    if (!confirm('Usunąć to wydarzenie?')) return;

    this.animalsSvc.deleteOwnerCalendarEvent(this.ownerId, entry._id).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e._id !== entry._id);
        this.applyEventsToCalendar();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się usunąć wydarzenia.';
      }
    });
  }

  /** wstrzykujemy zdarzenia do FullCalendar przez inputs */
  private applyEventsToCalendar(): void {
    const events = this.entries.map(e => ({
      id: e._id,
      title: e.animalName ? `${e.title} — ${e.animalName}` : e.title,
      start: e.date
    }));
    // tworzymy nowy obiekt, by Angular wykrył zmianę
    this.calendarOptions = { ...this.calendarOptions, events };
  }

  private onDateClick(arg: any): void {
    this.selectedDate = arg.dateStr;
    if (!this.showForm) this.newEvent.date = arg.dateStr;
  }

  // pomocnicze: notatki dla wybranej daty (jeśli używasz listy pod kalendarzem)
  getNotesForSelectedDate(): string[] {
    if (!this.selectedDate) return [];
    return this.entries.filter(e => e.date === this.selectedDate && e.note).map(e => e.note!);
  }

  private resetForm(): void {
    this.newEvent = { date: this.selectedDate ?? '', title: '', note: '' };
  }

  private today(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }
}
