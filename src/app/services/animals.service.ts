import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface Animal {
  _id: string;
  name: string;
  species: string;
}

@Injectable({ providedIn: 'root' })
export class AnimalsService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** CRUD */
  getById(id: string) {
    return this.http.get<Animal>(`${this.api}/animals/${id}`);
  }

  getForOwner(ownerId: string): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.api}/owners/${ownerId}/animals`);
  }

  addForOwner(ownerId: string, body: any) {
    return this.http.post<Animal>(`${this.api}/owners/${ownerId}/animals`, body);
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




}
