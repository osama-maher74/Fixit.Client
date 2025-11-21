export enum Gender {
  Male = 0,
  Female = 1
}

export interface ClientProfile {
  id: number;
  fName: string;
  lName: string;
  location: string;
  phoneNumber: string;
  profileImage?: string | null;
  gender: Gender;
  totalRequests: number;
}

export interface ClientApiResponse {
  id: number;
  fName: string;
  lName: string;
  location: string;
  phoneNumber: string;
  profileImage?: string | null;
  gender: Gender;
  totalRequests: number;
}
