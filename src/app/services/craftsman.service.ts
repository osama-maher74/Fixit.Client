import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CraftsmanProfile, UpdateCraftsmanVerificationDto } from '../models/craftsman.models';

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
   * Get all craftsmen (Admin only)
   * @returns Observable of CraftsmanProfile array
   */
  getAllCraftsMen(): Observable<CraftsmanProfile[]> {
    const url = this.CRAFTSMAN_API;
    console.log('CraftsmanService - getAllCraftsMen - API URL:', url);
    console.log('CraftsmanService - Making GET request to:', url);
    return this.http.get<CraftsmanProfile[]>(url);
  }

  /**
   * Get craftsman by ID
   * @param id - Craftsman ID
   * @returns Observable of CraftsmanProfile
   */
  getCraftsManById(id: number): Observable<CraftsmanProfile> {
    return this.http.get<CraftsmanProfile>(`${this.CRAFTSMAN_API}/${id}`);
  }

  /**
   * Update craftsman verification status (Admin only)
   * @param craftsman - Craftsman data with updated isVerified status
   * @returns Observable of void
   */
  updateCraftsmanVerification(craftsman: CraftsmanProfile): Observable<void> {
    console.log('CraftsmanService - updateCraftsmanVerification called with:', craftsman);

    const formData = new FormData();
    formData.append('Id', craftsman.id.toString());
    formData.append('FName', craftsman.fName);
    formData.append('LName', craftsman.lName);
    formData.append('Describtion', craftsman.describtion);
    formData.append('PhoneNumber', craftsman.phoneNumber);
    formData.append('ExperienceOfYears', craftsman.experienceOfYears.toString());
    formData.append('HourlyRate', craftsman.hourlyRate.toString());
    formData.append('IsVerified', craftsman.isVerified.toString());

    const url = `${this.CRAFTSMAN_API}/${craftsman.id}`;
    console.log('CraftsmanService - PUT URL:', url);
    console.log('CraftsmanService - IsVerified:', craftsman.isVerified);
    console.log('CraftsmanService - FormData entries:');
    formData.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('CraftsmanService - Making HTTP PUT request...');
    return this.http.put<void>(url, formData);
  }
}
