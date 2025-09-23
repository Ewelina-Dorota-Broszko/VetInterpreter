import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

// === DODAJ POD INTERFEJSAMI ===
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


@Injectable({ providedIn: 'root' })
export class AnimalsService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) { }

  // === W KLASIE AnimalsService – DODAJ TE TRZY METODY ===



  // wszystkie pomiary (owner + wszyscy weci)
  getTemperatureLogsAll(animalId: string) {
    return this.http.get<TemperatureLog[]>(
      `${this.api}/animals/${animalId}/temperature-logs`
    );
  }

  // usunięcie pojedynczego pomiaru (wet może usuwać TYLKO swoje)
  deleteTemperatureLog(animalId: string, logId: string) {
    return this.http.delete<{ message: string }>(
      `${this.api}/animals/${animalId}/temperature-logs/${logId}`
    );
  }
  // DODAJ — zgodne z backendem:
  addVisitHistoryEntry(animalId: string, body: any) {
    // POST /animals/:id/visit-history
    return this.http.post<any>(`${this.api}/animals/${animalId}/visit-history`, body);
  }

  deleteVisitHistoryEntry(animalId: string, visitId: string) {
    // DELETE /animalsti/:id/visit-history/:visitId
    return this.http.delete<any>(`${this.api}/animals/${animalId}/visit-history/${visitId}`);
  }


  /** CRUD */
  getById(id: string) {
    return this.http.get<Animal>(`${this.api}/animals/${id}`);
  }

  getForOwner(ownerId: string): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.api}/animals/owners/${ownerId}/animals`);
  }

  addForOwner(ownerId: string, body: any) {
    return this.http.post<Animal>(`${this.api}/animals/owners/${ownerId}/animals`, body);
  }

  /** Badania – przykładowe metody */
  addBloodTest(animalId: string, body: any) {
    return this.http.post(`${this.api}/animals/${animalId}/blood-tests`, body);
  }
  addUrineTest(animalId: string, body: any) {
    return this.http.post(`${this.api}/animals/${animalId}/urine-tests`, body);
  }
  addStoolTest(animalId: string, body: any) {
    return this.http.post(`${this.api}/animals/${animalId}/stool-tests`, body);
  }
  addTemperature(animalId: string, body: any) {
    return this.http.post(`${this.api}/animals/${animalId}/temperature-logs`, body);
  }
  addWeight(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/weight-history`, body);
  }
  addVaccination(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/vaccinations`, body);
  }
  addMedication(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/medications`, body);
  }
  addSymptom(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/symptoms`, body);
  }
  addVisit(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/visits`, body);
  }
  addDiabetesLog(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/diabetes-logs`, body);
  }
  updateMedication(animalId: string, medId: string, body: Partial<{ isActive: boolean }>) {
    return this.http.patch<any>(`${this.api}/animals/${animalId}/medications/${medId}`, body);
  }
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
  deleteAnimal(id: string) {
    return this.http.delete<{ message: string }>(`${this.api}/animals/${id}`);
  }


getBloodTestsVet(animalId: string) {
  return this.http.get<any[]>(`${this.api}/animals/${animalId}/blood-tests`, { params: { mine: '1' } });
}
getUrineTestsVet(animalId: string) {
  return this.http.get<any[]>(`${this.api}/animals/${animalId}/urine-tests`, { params: { mine: '1' } });
}
getStoolTestsVet(animalId: string) {
  return this.http.get<any[]>(`${this.api}/animals/${animalId}/stool-tests`, { params: { mine: '1' } });
}
getTemperatureLogsVet(animalId: string) {
  return this.http.get<TemperatureLog[]>(`${this.api}/animals/${animalId}/temperature-logs`, { params: { mine: '1' } });
}
getDiabetesLogsVet(animalId: string) {
  return this.http.get<any[]>(`${this.api}/animals/${animalId}/diabetes-logs`, { params: { mine: '1' } });
}
getWeightHistoryVet(animalId: string) {
  return this.http.get<any[]>(`${this.api}/animals/${animalId}/weight-history`, { params: { mine: '1' } });
}
getVaccinationsVet(animalId: string) {
  return this.http.get<any[]>(`${this.api}/animals/${animalId}/vaccinations`, { params: { mine: '1' } });
}
getMedicationsVet(animalId: string) {
  return this.http.get<any[]>(`${this.api}/animals/${animalId}/medications`, { params: { mine: '1' } });
}
getSymptomsVet(animalId: string) {
  return this.http.get<any[]>(`${this.api}/animals/${animalId}/symptoms`, { params: { mine: '1' } });
}


}
