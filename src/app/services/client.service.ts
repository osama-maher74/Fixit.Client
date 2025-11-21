import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClientProfile } from '../models/client.models';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private readonly CLIENT_API = `${environment.apiUrl}/Client`;

  /**
   * Get client profile by email
   * @param email - Client's email address
   * @returns Observable of ClientProfile
   */
  getClientByEmail(email: string): Observable<ClientProfile> {
    const params = new HttpParams().set('email', email);
    const url = `${this.CLIENT_API}/GetByEmail`;

    console.log('ClientService - Making API call to:', url);
    console.log('ClientService - With email:', email);
    console.log('ClientService - Full URL with params:', `${url}?email=${email}`);

    return this.http.get<ClientProfile>(url, { params });
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
   * @returns Observable of ClientProfile or Observable error
   */
  getCurrentUserProfile(): Observable<ClientProfile> {
    const email = this.getLoggedInEmail();

    console.log('ClientService - getCurrentUserProfile called');
    console.log('ClientService - Email from localStorage:', email);

    if (!email) {
      console.error('ClientService - No email found in localStorage!');
      console.error('ClientService - All localStorage keys:', Object.keys(localStorage));
      console.error('ClientService - localStorage.email value:', localStorage.getItem('email'));

      // Return Observable error instead of throwing synchronously
      return throwError(() => new Error('No logged-in user found'));
    }

    return this.getClientByEmail(email);
  }
}
