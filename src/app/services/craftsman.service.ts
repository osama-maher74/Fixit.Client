import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CraftsmanProfile, CraftsmanResponse, Craftsman } from '../models/craftsman.models';
// import { CraftsmanProfile, UpdateCraftsmanVerificationDto } from '../models/craftsman.models';

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

    return this.http.get<CraftsmanResponse>(url, { params }).pipe(
      map(response => {
        console.log('✅ CraftsmanService - API response:', response);
        // Extract craftsman from the wrapper object
        if (response && response.craftsMan) {
          console.log('✅ CraftsmanService - Extracted craftsman:', response.craftsMan);
          return response.craftsMan;
        }
        throw new Error('Invalid response format: craftsMan property not found');
      })
    );
  }

  /**
   * Get craftsman with reviews by email
   * Returns the full response including  reviews array
   */
  getCraftsmanWithReviewsByEmail(email: string): Observable<CraftsmanResponse> {
    const params = new HttpParams().set('email', email);
    const url = `${this.CRAFTSMAN_API}/GetByEmail`;

    console.log('CraftsmanService - Fetching craftsman with reviews for email:', email);

    return this.http.get<CraftsmanResponse>(url, { params }).pipe(
      map(response => {
        console.log('✅ CraftsmanService - Full response with reviews:', response);
        return response;
      })
    );
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
