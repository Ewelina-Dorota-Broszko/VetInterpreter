import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface VetRow {
  vetId: string;
  clinicName: string;
  licenseNo: string;
  phone: string;
  email: string;
  userId: string;
  lastLoginAt: string | null;
}

export interface OwnerAnimal {
  _id: string;
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  weightKg?: number;
  birthDate?: string;
}

export interface OwnerRow {
  ownerId: string;
  name: string;
  phone: string;
  email: string;
  userId: string;
  lastLoginAt: string | null;
  animalsCount: number;
  animals: OwnerAnimal[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = environment.apiUrl + '/admin';

  constructor(private http: HttpClient) {}

  listVets(params?: { search?: string; page?: number; limit?: number }) {
    return this.http.get<{ page: number; limit: number; total: number; rows: VetRow[] }>(
      `${this.api}/vets`,
      { params: (params as any) || {} }
    );
  }

  listOwners(params?: { search?: string; page?: number; limit?: number; includeAnimals?: '0'|'1' }) {
    return this.http.get<{ page: number; limit: number; total: number; rows: OwnerRow[] }>(
      `${this.api}/owners`,
      { params: { includeAnimals: '1', ...(params as any) } }
    );
  }

  deleteVet(vetId: string) {
    return this.http.delete<{ message: string }>(`${this.api}/vets/${vetId}`);
  }

  deleteOwner(ownerId: string) {
    return this.http.delete<{ message: string }>(`${this.api}/owners/${ownerId}`);
  }

  resetVetPassword(vetId: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${this.api}/vets/${vetId}/reset-password`, { newPassword });
  }

  resetOwnerPassword(ownerId: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${this.api}/owners/${ownerId}/reset-password`, { newPassword });
  }
}
