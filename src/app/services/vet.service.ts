// src/app/services/vet.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { firstValueFrom, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/** ====== MODELE ====== */
export interface WorkingHour {
  day: number;
  open: boolean;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface VetProfile {
  id?: string;
  _id?: string;
  userId?: string;

  clinicName: string;
  licenseNo: string;
  phone: string;
  email: string;
  website?: string;
  about?: string;

  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };

  acceptsNewPatients: boolean;
  acceptsEmergency?: boolean;
  emergencyPhone?: string;

  specialties?: string[];
  servicesOffered?: string[];
  languages?: string[];
  paymentMethods?: string[];

  appointmentDurationMin?: number;
  consultPrice?: number;

  workingHours?: WorkingHour[];
}

export interface VetCalendarEvent {
  _id?: string;
  date: string;   // YYYY-MM-DD
  title: string;
  note?: string;
  ownerId?: string;
  ownerName?: string;
  animalId?: string;
  animalName?: string;
}

/** ====== CLINICAL FILES (API-only; zapis w bazie) ====== */
export interface ClinicalFile {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  note?: string;
  uploadedAt?: string;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class VetService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /* ========= PROFIL ========= */
  getMe(): Observable<VetProfile> {
    return this.http.get<VetProfile>(`${this.api}/vets/me`).pipe(
      map((res: any) => {
        if (!res?.id && res?._id) res.id = String(res._id);
        if (res?.userId && typeof res.userId !== 'string') {
          try { res.userId = String(res.userId); } catch {}
        }
        return res as VetProfile;
      })
    );
  }

  updateMe(body: Partial<VetProfile>): Observable<VetProfile> {
    return this.http.patch<VetProfile>(`${this.api}/vets/me`, body).pipe(
      map((res: any) => {
        if (!res?.id && res?._id) res.id = String(res._id);
        if (res?.userId && typeof res.userId !== 'string') {
          try { res.userId = String(res.userId); } catch {}
        }
        return res as VetProfile;
      })
    );
  }

  /* ========= KATALOG / POWIĄZANIA ========= */
  listVets() { return this.http.get<any[]>(`${this.api}/vets`); }
  getVetById(id: string) { return this.http.get<any>(`${this.api}/vets/${id}`); }
  assignAnimalToVet(animalId: string, vetId: string) {
    return this.http.post(`${this.api}/vets/assign`, { animalId, vetId });
  }
  unassignAnimalFromVet(animalId: string) {
    return this.http.post(`${this.api}/vets/unassign`, { animalId });
  }

  /* ========= PACJENCI ========= */
  myPatients() {
    return this.http.get<Array<{ owner: any; animals: any[] }>>(`${this.api}/vets/me/patients`);
  }
  getPatients(search?: string) {
    const params = search ? { params: { search } } : {};
    return this.http.get<any[]>(`${this.api}/vets/patients`, params);
  }
  getPatientDetails(ownerId: string) {
    return this.http.get<{ owner: any; animals: any[] }>(`${this.api}/vets/patients/${ownerId}`);
  }
  getAnimalAsVet(animalId: string) {
    return this.http.get<any>(`${this.api}/vets/animals/${animalId}`);
  }

  /* ========= KALENDARZ WETA – SMART (local/API) ========= */
  private readonly CALENDAR_DISCOVERY_MODE: 'local' | 'auto' =
    (environment as any).vetCalendarMode || 'local';

  private meCandidates(): string[] {
    return [
      `${this.api}/vets/me/appointments`,
      `${this.api}/vets/me/calendar`,
      `${this.api}/vets/me/events`,
    ];
  }
  private byIdCandidates(vetId: string): string[] {
    return [
      `${this.api}/vets/${vetId}/appointments`,
      `${this.api}/vets/${vetId}/calendar`,
      `${this.api}/vets/${vetId}/events`,
    ];
  }

  private _meCalBase: string | null = null;
  private _byIdCalBase: Record<string, string> = {};
  private _useLocalForMe = this.CALENDAR_DISCOVERY_MODE === 'local';
  private _useLocalForId: Record<string, boolean> = {};

  private async resolveMeBaseOrLocal(): Promise<{mode:'api'|'local', base?:string}> {
    if (this._useLocalForMe) return { mode: 'local' };
    if (this._meCalBase) return { mode: 'api', base: this._meCalBase };
    const url = this.meCandidates()[0];
    try {
      await firstValueFrom(this.http.get(url, { observe: 'response' }));
      this._meCalBase = url;
      return { mode: 'api', base: url };
    } catch {
      this._useLocalForMe = true;
      return { mode: 'local' };
    }
  }

  private async resolveByIdBaseOrLocal(vetId: string): Promise<{mode:'api'|'local', base?:string}> {
    if (this._useLocalForId[vetId] || this.CALENDAR_DISCOVERY_MODE === 'local') return { mode: 'local' };
    if (this._byIdCalBase[vetId]) return { mode: 'api', base: this._byIdCalBase[vetId] };
    const url = this.byIdCandidates(vetId)[0];
    try {
      await firstValueFrom(this.http.get(url, { observe: 'response' }));
      this._byIdCalBase[vetId] = url;
      return { mode: 'api', base: url };
    } catch {
      this._useLocalForId[vetId] = true;
      return { mode: 'local' };
    }
  }

  async getVetCalendarSmart(vetId?: string): Promise<VetCalendarEvent[]> {
    const res = vetId ? await this.resolveByIdBaseOrLocal(vetId) : await this.resolveMeBaseOrLocal();
    if (res.mode === 'api' && res.base) {
      return await firstValueFrom(this.http.get<VetCalendarEvent[]>(res.base));
    }
    return this.localGetList(vetId);
  }

  async addVetCalendarEventSmart(payload: VetCalendarEvent, vetId?: string): Promise<VetCalendarEvent> {
    const res = vetId ? await this.resolveByIdBaseOrLocal(vetId) : await this.resolveMeBaseOrLocal();
    if (res.mode === 'api' && res.base) {
      return await firstValueFrom(this.http.post<VetCalendarEvent>(res.base, payload));
    }
    const list = this.localGetList(vetId);
    const created: VetCalendarEvent = { ...payload, _id: payload._id || this.randId() };
    list.push(created);
    this.localSaveList(vetId, list);
    return created;
  }

  async deleteVetCalendarEventSmart(eventId: string, vetId?: string): Promise<void> {
    const res = vetId ? await this.resolveByIdBaseOrLocal(vetId) : await this.resolveMeBaseOrLocal();
    if (res.mode === 'api' && res.base) {
      await firstValueFrom(this.http.delete<void>(`${res.base}/${eventId}`));
      return;
    }
    const list = this.localGetList(vetId).filter(e => e._id !== eventId);
    this.localSaveList(vetId, list);
  }

  private localKey(vetId?: string) { return `vetCal:${vetId || 'me'}`; }
  private localGetList(vetId?: string): VetCalendarEvent[] {
    try {
      const raw = localStorage.getItem(this.localKey(vetId));
      return raw ? JSON.parse(raw) as VetCalendarEvent[] : [];
    } catch { return []; }
  }
  private localSaveList(vetId: string | undefined, list: VetCalendarEvent[]) {
    try { localStorage.setItem(this.localKey(vetId), JSON.stringify(list)); } catch {}
  }
  private randId(): string { return `${Date.now().toString(16)}${Math.random().toString(16).slice(2,10)}`; }

  /* ========= CLINICAL FILES — API-ONLY ========= */
  private clinicalBase = `${this.api}/vets/me/clinical-files`;

  /** Lista plików z bazy */
  getMyClinicalFiles(): Observable<ClinicalFile[]> {
    return this.http.get<ClinicalFile[]>(this.clinicalBase);
  }

  /** Upload pojedynczego pliku z opcjonalną notatką (multipart/form-data) */
  uploadMyClinicalFile(file: File, note?: string): Observable<ClinicalFile> {
    const form = new FormData();
    form.append('file', file);
    if (note && note.trim()) form.append('note', note.trim());
    return this.http.post<ClinicalFile>(this.clinicalBase, form);
  }

  /** Upload z progressem (jeśli chcesz progressbar) */
  uploadMyClinicalFileWithProgress(file: File, note?: string): Observable<HttpEvent<unknown>> {
    const form = new FormData();
    form.append('file', file);
    if (note && note.trim()) form.append('note', note.trim());
    return this.http.post(this.clinicalBase, form, { reportProgress: true, observe: 'events' });
  }

  /** Usuń plik */
  deleteMyClinicalFile(id: string): Observable<void> {
    return this.http.delete<void>(`${this.clinicalBase}/${id}`);
  }

  /** Pobierz plik (BLOB) */
  downloadMyClinicalFile(id: string): Observable<Blob> {
    return this.http.get(`${this.clinicalBase}/${id}/download`, { responseType: 'blob' });
  }
}

/** Helper dla guarda — eksport wymagany przez vet-profile-complete.guard.ts */
export function isVetProfileComplete(p?: VetProfile | null): boolean {
  if (!p) return false;
  const ok = (v?: string | null) => !!(v && String(v).trim().length);
  return ok(p.clinicName) && ok(p.licenseNo) && ok(p.phone) && ok(p.email);
}
