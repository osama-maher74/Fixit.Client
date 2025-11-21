export enum Gender {
  Male = 0,
  Female = 1
}

export interface CraftsmanProfile {
  fName: string;
  lName: string;
  describtion: string;
  profileImage?: string | null;
  rating: number;
  location: string;
  isVerified: boolean;
  normalizedEmail: string;
}
