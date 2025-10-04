import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, map } from 'rxjs';

export interface VetPatientRow {
  owner: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  animalsCount: number;
}

export interface VetPatientDetail {
  owner: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  animals: Array<{
    _id: string;
    name: string;
    species: string;
    breed?: string;
    sex?: string;
    weightKg?: number;
    birthDate?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class VetPatientsService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  listPatients(): Observable<VetPatientRow[]> {
    return this.http.get<VetPatientRow[]>(`${this.api}/vets/me/patients`).pipe(
      map(rows => rows || [])
    );
  }

 getPatient(ownerId: string): Observable<VetPatientDetail> {
  return this.http.get<VetPatientDetail>(`${this.api}/vets/patients/${ownerId}`);
}

  
}
