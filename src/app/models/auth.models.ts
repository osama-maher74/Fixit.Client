export enum Gender {
  Male = 0,
  Female = 1
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface ClientRegisterRequest {
  fName: string;
  lName: string;
  email: string;
  password: string;
  location: string;
  phoneNumber: string;
  gender: Gender;
  dateOfBirth: string;
}

export interface CraftsmanRegisterRequest {
  fName: string;
  lName: string;
  email: string;
  password: string;
  location: string;
  phoneNumber: string;
  description?: string;
  hourlyRate: number;
  experienceOfYears: number;
  nationalId: string;
  gender: Gender;
  dateOfBirth: string;
  serviceId: number;
}

export interface AuthResponse {
  id?: number;
  token?: string;
  fName?: string;
  lName?: string;
  email?: string;
  role?: string;
  message?: string;
  success?: boolean;
}

export interface User {
  id: string;
  email: string;
  fName: string;
  lName: string;
  role: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}
