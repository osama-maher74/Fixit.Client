export enum Gender {
  Male = 0,
  Female = 1
}

export interface CraftsmanProfile {
  id: number;
  fName: string;
  lName: string;
  describtion: string;
  phoneNumber: string;
  profileImage?: string | null;
  rating: number;
  location: string;
  isVerified: boolean;
  normalizedEmail: string;
  experienceOfYears: number;
  hourlyRate: number;
}

export interface Craftsman {
  id: number;
  fName: string;
  lName: string;
  describtion: string;
  profileImage: string;
  rating: number;
  location: string;
  isVerified: boolean;
  normalizedEmail: string;
  experienceOfYears: number;
  hourlyRate: number;
  phoneNumber: string;
}
