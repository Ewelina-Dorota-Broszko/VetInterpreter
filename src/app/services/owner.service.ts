import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}
  getMe() {
    return this.http.get<any>(`${this.api}/owners/me`);
  }
  getMyAnimals() {
    return this.http.get<any[]>(`${this.api}/owners/me/animals`);
  }
  getMyFullProfile() {
    return this.http.get<{ owner: any; animals: any[] }>(`${this.api}/owners/me/full`);
  }
  
}
