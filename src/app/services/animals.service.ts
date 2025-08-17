import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AnimalsService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** CRUD */
  getById(id: string) {
    return this.http.get<any>(`${this.api}/animals/${id}`);
  }
  addForOwner(ownerId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/owners/${ownerId}/animals`, body);
  }

  /** Badania – przykładowe metody */
  addBloodTest(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/blood-tests`, body);
  }
  addUrineTest(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/urine-tests`, body);
  }
  addStoolTest(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/stool-tests`, body);
  }
  addTemperature(animalId: string, body: any) {
    return this.http.post<any>(`${this.api}/animals/${animalId}/temperature-logs`, body);
  }
}
