import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IdVerificationResponse {
  isValid: boolean;
  message: string;
  errors: string[];
  warnings: string[];
  extractedData: {
    fullName: string | null;
    nationalIdNumber: string | null;
    expiryDate: string | null;
    isExpired: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class IdVerificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Craftsman`;

  /**
   * Verify Egyptian National ID by uploading front and back images
   * @param frontImage Front photo of the ID card
   * @param backImage Back photo of the ID card
   * @param email User's email address
   * @returns Observable with verification result
   */
  verifyNationalId(frontImage: File, backImage: File, email: string): Observable<IdVerificationResponse> {
    const formData = new FormData();
    formData.append('frontImage', frontImage);
    formData.append('backImage', backImage);
    formData.append('email', email);

    return this.http.post<IdVerificationResponse>(
      `${this.apiUrl}/verify-national-id`,
      formData
    );
  }

  /**
   * Validate image file before upload
   * @param file Image file to validate
   * @returns Validation error message or null if valid
   */
  validateImageFile(file: File): string | null {
    const maxSizeMB = environment.idVerification.maxFileSizeMB;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const allowedFormats = environment.idVerification.allowedFormats;

    // Check file size
    if (file.size > maxSizeBytes) {
      return `ID_VERIFICATION.ERRORS.IMAGE_TOO_LARGE`;
    }

    // Check file type
    if (!allowedFormats.includes(file.type)) {
      return `ID_VERIFICATION.ERRORS.INVALID_IMAGE_TYPE`;
    }

    return null;
  }

  /**
   * Convert file to base64 for preview
   * @param file Image file
   * @returns Promise with base64 string
   */
  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsDataURL(file);
    });
  }
}
