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
  User
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

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
      dateOfBirth: data.dateOfBirth // ISO format string
    };

    console.log('Sending craftsman registration JSON:', payload);

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/Account/register/craftsman`,
      payload
    ).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private handleAuthResponse(response: AuthResponse): void {
    console.log('Auth response received:', response);

    if (response.token) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
    }

    if (response.user) {
      console.log('Storing user:', response.user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }

    if (response.success || response.token) {
      this.isAuthenticated.set(true);
      console.log('User authenticated, isAuthenticated:', this.isAuthenticated());
      console.log('Current user:', this.currentUserSubject.value);
    }
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
