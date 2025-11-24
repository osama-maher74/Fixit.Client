import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CraftsmanProfile } from '../models/craftsman.models';

@Injectable({
  providedIn: 'root'
})
export class CraftsmanService {
  private http = inject(HttpClient);
  private readonly CRAFTSMAN_API = `${environment.apiUrl}/CraftsMan`;

  /**
   * Get craftsman profile by email
   * @param email - Craftsman's email address
   * @returns Observable of CraftsmanProfile
   */
  getCraftsmanByEmail(email: string): Observable<CraftsmanProfile> {
    const params = new HttpParams().set('email', email);
    const url = `${this.CRAFTSMAN_API}/GetByEmail`;

    console.log('CraftsmanService - Making API call to:', url);
    console.log('CraftsmanService - With email:', email);
    console.log('CraftsmanService - Full URL with params:', `${url}?email=${email}`);

    return this.http.get<CraftsmanProfile>(url, { params });
  }

  /**
   * Get logged-in user's email from localStorage
   * @returns email string or null
   */
  getLoggedInEmail(): string | null {
    return localStorage.getItem('email');
  }

  /**
   * Get current user's profile
   * @returns Observable of CraftsmanProfile or Observable error
   */
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

  /**
   * Update craftsman profile
   * @param id - Craftsman ID
   * @param formData - FormData containing update fields and optional profile image
   * @returns Observable of updated CraftsmanProfile
   */
  updateCraftsman(id: number, formData: FormData): Observable<CraftsmanProfile> {
    const url = `${this.CRAFTSMAN_API}/${id}`;

    console.log('CraftsmanService - Updating craftsman with ID:', id);
    console.log('CraftsmanService - Update URL:', url);

    return this.http.put<CraftsmanProfile>(url, formData);
  }

  /**
   * Get craftsmen by location and service name
   * @param location - Location string
   * @param serviceName - Service name string
   * @returns Observable of CraftsmanProfile array
   */
  getCraftsmenByLocationAndService(location: string, serviceName: string): Observable<CraftsmanProfile[]> {
    const params = new HttpParams()
      .set('location', location)
      .set('servicename', serviceName);

    const url = `${this.CRAFTSMAN_API}/GetByLocation`;

    console.log('CraftsmanService - Fetching craftsmen from:', url);
    console.log('CraftsmanService - Params:', params.toString());

    return this.http.get<CraftsmanProfile[]>(url, { params });
  }
}
