import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  ClientRegisterRequest,
  CraftsmanRegisterRequest,
  AuthResponse,
  User,
  ResetPasswordRequest
} from '../models/auth.models';
import type { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService?: NotificationService;

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  public isAuthenticated = signal<boolean>(this.hasToken());

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/Account/login`,
      credentials
    ).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  registerClient(data: ClientRegisterRequest): Observable<AuthResponse> {
    // Client registration sends JSON body with camelCase properties
    // Backend expects: fName, lName, email, password, location, phoneNumber, gender, dateOfBirth

    const payload = {
      fName: data.fName,
      lName: data.lName,
      email: data.email,
      password: data.password,
      location: data.location,
      phoneNumber: data.phoneNumber,
      gender: data.gender, // Number (0 or 1)
      dateOfBirth: data.dateOfBirth // ISO format string
    };

    console.log('Sending client registration JSON:', payload);

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/Account/register/client`,
      payload
    ).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  registerCraftsman(data: CraftsmanRegisterRequest): Observable<AuthResponse> {
    // Craftsman registration sends JSON body with camelCase properties
    // Backend expects: fName, lName, email, password, location, phoneNumber, description,
    // hourlyRate, experienceOfYears, nationalId, gender, dateOfBirth

    const payload = {
      fName: data.fName,
      lName: data.lName,
      email: data.email,
      password: data.password,
      location: data.location,
      phoneNumber: data.phoneNumber,
      description: data.description || '',
      hourlyRate: data.hourlyRate,
      experienceOfYears: data.experienceOfYears,
      nationalId: data.nationalId,
      gender: data.gender, // Number (0 or 1)
      dateOfBirth: data.dateOfBirth, // ISO format string
      serviceId: data.serviceId
    };

    console.log('Sending craftsman registration JSON:', payload);

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/Account/register/craftsman`,
      payload
    ).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/Account/forgot-password`,
      { email }
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/Account/reset-password`,
      data
    );
  }

  validateResetToken(email: string, token: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/Account/reset-password/validate`,
      { params: { email, token } }
    );
  }

  logout(): void {
    // Disconnect SignalR before clearing auth data
    if (this.notificationService) {
      this.notificationService.disconnectSignalR();
    }

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('email');
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  // Called by NotificationService to set itself (avoids circular dependency)
  setNotificationService(service: NotificationService): void {
    this.notificationService = service;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private handleAuthResponse(response: AuthResponse): void {
    console.log('========== AUTH RESPONSE START ==========');
    console.log('Full response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response));

    // Store token
    if (response.token) {
      console.log('✅ Token found:', response.token.substring(0, 20) + '...');
      localStorage.setItem(this.TOKEN_KEY, response.token);
    } else {
      console.warn('⚠️ No token in response');
    }

    // Backend returns flat structure with user properties at root level
    // Create User object from response properties
    if (response.email && response.fName) {
      console.log('✅ User data found at root level');
      console.log('- ID:', response.id);
      console.log('- Email:', response.email);
      console.log('- Name:', response.fName, response.lName);
      console.log('- Role:', response.role);

      const user: User = {
        id: response.id?.toString() || '',
        email: response.email,
        fName: response.fName,
        lName: response.lName || '',
        role: response.role || 'Client'
      };

      console.log('✅ Created user object:', user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));

      // Store email separately for profile API calls
      console.log('✅ Storing email in localStorage:', response.email);
      localStorage.setItem('email', response.email);
      console.log('✅ Email stored. Verification:', localStorage.getItem('email'));

      this.currentUserSubject.next(user);
    } else {
      console.warn('⚠️ Incomplete user data in response');
      console.warn('- email:', response.email);
      console.warn('- fName:', response.fName);
      console.warn('- lName:', response.lName);
    }

    if (response.success || response.token) {
      this.isAuthenticated.set(true);
      console.log('✅ User authenticated, isAuthenticated:', this.isAuthenticated());
      console.log('✅ Current user:', this.currentUserSubject.value);
    }

    console.log('========== AUTH RESPONSE END ==========');
    console.log('Final localStorage state:');
    console.log('- auth_token:', localStorage.getItem(this.TOKEN_KEY) ? 'EXISTS' : 'MISSING');
    console.log('- current_user:', localStorage.getItem(this.USER_KEY) ? 'EXISTS' : 'MISSING');
    console.log('- email:', localStorage.getItem('email') || 'MISSING');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private loadUserFromStorage(): void {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
      this.isAuthenticated.set(true);
    }
  }
}
