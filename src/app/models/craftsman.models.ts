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
  nationalId: string;
}

export interface UpdateCraftsmanVerificationDto {
  id: number;
  fName: string;
  lName: string;
  describtion: string;
  phoneNumber: string;
  experienceOfYears: number;
  hourlyRate: number;
  isVerified: boolean;
}
