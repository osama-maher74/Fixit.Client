import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CraftsmanProfile, Craftsman } from '../models/craftsman.models';

@Injectable({
  providedIn: 'root'
})
export class CraftsmanService {
  private http = inject(HttpClient);
  private readonly CRAFTSMAN_API = `${environment.apiUrl}/CraftsMan`;

  getCraftsmanByEmail(email: string): Observable<CraftsmanProfile> {
    const params = new HttpParams().set('email', email);
    const url = `${this.CRAFTSMAN_API}/GetByEmail`;

    console.log('CraftsmanService - Making API call to:', url);
    console.log('CraftsmanService - With email:', email);
    console.log('CraftsmanService - Full URL with params:', `${url}?email=${email}`);

    return this.http.get<CraftsmanProfile>(url, { params });
  }

  getLoggedInEmail(): string | null {
    return localStorage.getItem('email');
  }

  getCurrentUserProfile(): Observable<CraftsmanProfile> {
    const email = this.getLoggedInEmail();

    console.log('CraftsmanService - getCurrentUserProfile called');
    console.log('CraftsmanService - Email from localStorage:', email);

    if (!email) {
      console.error('CraftsmanService - No email found in localStorage!');
      console.error('CraftsmanService - All localStorage keys:', Object.keys(localStorage));
      console.error('CraftsmanService - localStorage.email value:', localStorage.getItem('email'));

      return throwError(() => new Error('No logged-in user found'));
    }

    return this.getCraftsmanByEmail(email);
  }

  updateCraftsman(id: number, formData: FormData): Observable<CraftsmanProfile> {
    const url = `${this.CRAFTSMAN_API}/${id}`;

    console.log('CraftsmanService - Updating craftsman with ID:', id);
    console.log('CraftsmanService - Update URL:', url);

    return this.http.put<CraftsmanProfile>(url, formData);
  }

  getCraftsmenByLocation(location: string, serviceName: string): Observable<Craftsman[]> {
    const params = new HttpParams()
      .set('location', location)
      .set('servicename', serviceName);
    const url = `${this.CRAFTSMAN_API}/GetByLocation`;

    console.log('CraftsmanService - Getting craftsmen by location');
    console.log('CraftsmanService - URL:', url);
    console.log('CraftsmanService - Location:', location);
    console.log('CraftsmanService - Service:', serviceName);

    return this.http.get<Craftsman[]>(url, { params });
  }

  getCraftsmanById(id: number): Observable<CraftsmanProfile> {
    const url = `${this.CRAFTSMAN_API}/${id}`;
    return this.http.get<CraftsmanProfile>(url);
  }
}
