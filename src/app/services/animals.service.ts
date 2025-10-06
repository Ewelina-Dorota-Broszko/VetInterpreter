import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface Animal {
  _id: string;
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  weightKg?: number;
  birthDate?: string;
  vetId?: string;
}

export interface CalendarEntry {
  _id: string;        // nadawane przez Mongo
  date: string;       // YYYY-MM-DD
  title: string;
  note?: string;
}

/** DODATKOWO – zgodnie z Twoim typem */
export interface TemperatureLog {
  _id?: string;
  date: string;            // YYYY-MM-DD
  time: string;            // HH:mm
  temperature: number;
  behavior?: 'normal' | 'lethargic' | 'agitated' | 'unresponsive' | '';
  appetite?: 'normal' | 'reduced' | 'none' | '';
  comments?: string;
  addedBy?: 'owner' | 'vet';
  addedByVetId?: string | null;
  addedAt?: string;        // ISO
}

type Scope = 'all' | 'vet' | 'owner' | 'mine';

@Injectable({ providedIn: 'root' })
export class AnimalsService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) { }

  /** ========== POMOCNICZE ========== */
  private getWithScope<T>(url: string, scope?: Scope): Observable<T> {
    const params = scope ? new HttpParams().set('scope', scope) : undefined;
    return this.http.get<T>(url, { params });
  }

  /** ========== CRUD ========== */
  getById(id: string) {
    return this.http.get<Animal>(`${this.api}/animals/${id}`);
  }

  getForOwner(ownerId: string): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.api}/animals/owners/${ownerId}/animals`);
  }

  addForOwner(ownerId: string, body: any) {
    return this.http.post<Animal>(`${this.api}/animals/owners/${ownerId}/animals`, body);
  }

  deleteAnimal(id: string) {
    return this.http.delete<{ message: string }>(`${this.api}/animals/${id}`);
  }

  /** ========== SUBKOLEKCJE z obsługą ?scope= ========== */
  // BLOOD
  getBloodTests(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/blood-tests`, scope);
  }
  addBloodTest(animalId: string, body: any) {
    return this.http.post(`${this.api}/animals/${animalId}/blood-tests`, body);
  }
  deleteBloodTest(animalId: string, testId: string) {
    return this.http.delete(`${this.api}/animals/${animalId}/blood-tests/${testId}`);
  }

  // URINE
  getUrineTests(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/urine-tests`, scope);
  }
  addUrineTest(animalId: string, body: any) {
    return this.http.post(`${this.api}/animals/${animalId}/urine-tests`, body);
  }
  deleteUrineTest(animalId: string, testId: string) {
    return this.http.delete(`${this.api}/animals/${animalId}/urine-tests/${testId}`);
  }

  // STOOL
  getStoolTests(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/stool-tests`, scope);
  }
  addStoolTest(animalId: string, body: any) {
    return this.http.post(`${this.api}/animals/${animalId}/stool-tests`, body);
  }
  deleteStoolTest(animalId: string, testId: string) {
    return this.http.delete(`${this.api}/animals/${animalId}/stool-tests/${testId}`);
  }

  // TEMPERATURE
  getTemperatureLogs(animalId: string, scope?: Scope) {
    return this.getWithScope<TemperatureLog[]>(`${this.api}/animals/${animalId}/temperature-logs`, scope);
  }
  addTemperature(animalId: string, body: any) {
    return this.http.post(`${this.api}/animals/${animalId}/temperature-logs`, body);
  }
  deleteTemperatureLog(animalId: string, logId: string) {
    return this.http.delete<{ message: string }>(`${this.api}/animals/${animalId}/temperature-logs/${logId}`);
  }

  // DIABETES
  getDiabetesLogs(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/diabetes-logs`, scope);
  }
  addDiabetesLog(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/diabetes-logs`, body);
  }
  deleteDiabetesLog(animalId: string, entryId: string) {
    return this.http.delete<any>(`${this.api}/animals/${animalId}/diabetes-logs/${entryId}`);
  }

  // WEIGHT
  getWeightHistory(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/weight-history`, scope);
  }
  addWeight(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/weight-history`, body);
  }
  deleteWeight(animalId: string, entryId: string) {
    return this.http.delete<any>(`${this.api}/animals/${animalId}/weight-history/${entryId}`);
  }

  // VACCINATIONS
  getVaccinations(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/vaccinations`, scope);
  }
  addVaccination(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/vaccinations`, body);
  }
  deleteVaccination(animalId: string, vaccId: string) {
    return this.http.delete<any>(`${this.api}/animals/${animalId}/vaccinations/${vaccId}`);
  }

  // MEDICATIONS
  getMedications(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/medications`, scope);
  }
  addMedication(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/medications`, body);
  }
  updateMedication(animalId: string, medId: string, body: Partial<{ isActive: boolean }>) {
    return this.http.patch<any>(`${this.api}/animals/${animalId}/medications/${medId}`, body);
  }
  deleteMedication(animalId: string, medId: string) {
    return this.http.delete<any>(`${this.api}/animals/${animalId}/medications/${medId}`);
  }

  // SYMPTOMS
  getSymptoms(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/symptoms`, scope);
  }
  addSymptom(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/symptoms`, body);
  }
  deleteSymptom(animalId: string, symptomId: string) {
    return this.http.delete<any>(`${this.api}/animals/${animalId}/symptoms/${symptomId}`);
  }

  // VISIT HISTORY (uwaga: ścieżka to /visit-history)
  getVisitHistory(animalId: string, scope?: Scope) {
    return this.getWithScope<any[]>(`${this.api}/animals/${animalId}/visit-history`, scope);
  }
  addVisitHistoryEntry(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/visit-history`, body);
  }
  deleteVisitHistoryEntry(animalId: string, visitId: string) {
    return this.http.delete<any>(`${this.api}/animals/${animalId}/visit-history/${visitId}`);
  }

  /** ========== OWNER (kalendarz) ========== */
  getMyOwner() {
    return this.http.get<{ _id: string; userId: string; name: string; email?: string; phone?: string }>(
      `${this.api}/owners/me`
    );
  }
  getOwnerCalendar(ownerId: string) {
    return this.http.get<any[]>(`${this.api}/animals/owners/${ownerId}/calendar`);
  }
  addOwnerCalendarEvent(ownerId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/owners/${ownerId}/calendar`, body);
  }
  deleteOwnerCalendarEvent(ownerId: string, eventId: string) {
    return this.http.delete<any>(`${this.api}/animals/owners/${ownerId}/calendar/${eventId}`);
  }
  // w AnimalsService – opcjonalny alias dla starego kodu
  getTemperatureLogsVet(animalId: string) {
    return this.getTemperatureLogs(animalId, 'mine');
  }
  

}
