import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, Observable } from 'rxjs';

export interface WorkingHour {
  day: number;        // 0..6 (Pon..Nd)
  open: boolean;
  start: string;      // "HH:mm"
  end: string;        // "HH:mm"
  breakStart?: string;
  breakEnd?: string;
}

export interface VetProfile {
  // identyfikatory (opcjonalne — ale postaramy się je zawsze zapełnić w getMe)
  id?: string;        // <- ID profilu veta (mapowane z _id)
  _id?: string;       // <- może przyjść z backendu
  userId?: string;    // <- ID użytkownika (string po mapowaniu)

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

@Injectable({ providedIn: 'root' })
export class VetService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** Zwraca profil veta; gwarantuje obecność pola `id` (zmapowane z `_id` jeśli trzeba) */
  getMe(): Observable<VetProfile> {
    return this.http.get<VetProfile>(`${this.api}/vets/me`).pipe(
      map((res: any) => {
        // zapewnij id z _id
        if (!res?.id && res?._id) res.id = String(res._id);
        // userId na string (gdy przyjdzie jako ObjectId)
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
}
