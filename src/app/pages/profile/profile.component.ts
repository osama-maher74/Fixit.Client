import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ClientService } from '../../services/client.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { ClientProfile } from '../../models/client.models';
import { CraftsmanProfile } from '../../models/craftsman.models';

type UserProfile = ClientProfile | CraftsmanProfile;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private clientService = inject(ClientService);
  private craftsmanService = inject(CraftsmanService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // Signals for reactive state management
  profile = signal<UserProfile | null>(null);
  userRole = signal<'client' | 'craftsman' | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProfile();
  }

  /**
   * Get user role from localStorage
   */
  private getUserRole(): 'client' | 'craftsman' | null {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user.role?.toLowerCase();
        if (role === 'craftsman') {
          return 'craftsman';
        } else if (role === 'client') {
          return 'client';
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    return null;
  }

  /**
   * Load the current user's profile based on their role
   */
  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = localStorage.getItem('email');
    const role = this.getUserRole();

    console.log('Profile Component - Email from localStorage:', email);
    console.log('Profile Component - User role:', role);
    console.log('Profile Component - All localStorage:', { ...localStorage });

    if (!email || !role) {
      this.errorMessage.set('No logged-in user found');
      this.isLoading.set(false);
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }

    this.userRole.set(role);

    // Load profile based on role
    if (role === 'craftsman') {
      this.craftsmanService.getCurrentUserProfile().subscribe({
        next: (data: CraftsmanProfile) => {
          console.log('Profile Component - Craftsman profile data received:', data);
          this.profile.set(data);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.handleProfileError(error);
        }
      });
    } else {
      this.clientService.getCurrentUserProfile().subscribe({
        next: (data: ClientProfile) => {
          console.log('Profile Component - Client profile data received:', data);
          this.profile.set(data);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.handleProfileError(error);
        }
      });
    }
  }

  /**
   * Handle profile loading error
   */
  private handleProfileError(error: any): void {
    console.error('Profile Component - Error loading profile:', error);
    console.error('Profile Component - Error status:', error.status);
    console.error('Profile Component - Error message:', error.message);

    this.errorMessage.set(
      error.message || 'Failed to load profile. Please try again.'
    );
    this.isLoading.set(false);

    if (error.message === 'No logged-in user found') {
      console.log('Profile Component - No email found, redirecting to login in 5 seconds...');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 5000);
    }
  }

  /**
   * Check if current user is a craftsman
   */
  isCraftsman(): boolean {
    return this.userRole() === 'craftsman';
  }

  /**
   * Check if current user is a client
   */
  isClient(): boolean {
    return this.userRole() === 'client';
  }

  /**
   * Get client profile (type guard)
   */
  getClientProfile(): ClientProfile | null {
    const p = this.profile();
    return this.isClient() ? (p as ClientProfile) : null;
  }

  /**
   * Get craftsman profile (type guard)
   */
  getCraftsmanProfile(): CraftsmanProfile | null {
    const p = this.profile();
    return this.isCraftsman() ? (p as CraftsmanProfile) : null;
  }

  /**
   * Get full name
   */
  getFullName(): string {
    const p = this.profile();
    return p ? `${p.fName} ${p.lName}` : '';
  }

  /**
   * Get gender display text (for client only)
   */
  getGenderText(): string {
    const p = this.getClientProfile();
    if (!p) return '';
    return p.gender === 0 ? this.translate.instant('PROFILE.MALE') : this.translate.instant('PROFILE.FEMALE');
  }

  /**
   * Get star rating array for craftsman
   */
  getStarArray(): { filled: number[], empty: number[] } {
    const p = this.getCraftsmanProfile();
    const rating = p?.rating || 0;
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    return {
      filled: Array(fullStars).fill(0).map((_, i) => i),
      empty: Array(emptyStars).fill(0).map((_, i) => i)
    };
  }

  /**
   * Get verification status text for craftsman
   */
  getVerificationText(): string {
    const p = this.getCraftsmanProfile();
    return p?.isVerified ? this.translate.instant('PROFILE.VERIFIED') : this.translate.instant('PROFILE.NOT_VERIFIED');
  }


  /**
   * Get profile image URL or default avatar
   */
  getProfileImageUrl(): string {
    const p = this.profile();
    if (p?.profileImage && p.profileImage.trim() !== '') {
      console.log('Profile image path from backend:', p.profileImage);

      // If it's a full HTTP/HTTPS URL, clean up double slashes and return
      if (p.profileImage.startsWith('http://') || p.profileImage.startsWith('https://')) {
        // Fix double slashes in the URL (e.g., https://localhost:7058//images/... -> https://localhost:7058/images/...)
        const cleanedUrl = p.profileImage.replace(/([^:]\/)\/+/g, '$1');
        console.log('Cleaned image URL:', cleanedUrl);
        return cleanedUrl;
      }

      // Normalize the path: convert backslashes to forward slashes and ensure leading slash
      let imagePath = p.profileImage.replace(/\\/g, '/');
      if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
      }

      // Backend returns the path like /images/ProfilePics/699cd57a-cbcc-4c81-a777-28af484aa6d6.png
      // Just prepend the base URL
      const imageUrl = `https://localhost:7058${imagePath}`;
      console.log('Constructed image URL:', imageUrl);

      return imageUrl;
    }

    // Default avatar - simple SVG with gold background and white user icon
    console.log('No profile image, using default avatar');
    return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22%3E%3Ccircle cx=%22100%22 cy=%22100%22 r=%22100%22 fill=%22%23FDB813%22/%3E%3Cpath fill=%22%23fff%22 d=%22M100 95c13.8 0 25-11.2 25-25s-11.2-25-25-25-25 11.2-25 25 11.2 25 25 25zm-40 20c0-16.7 13.3-30 40-30s40 13.3 40 30v10H60v-10z%22/%3E%3C/svg%3E';
  }


  /**
   * Navigate to craftsman reviews page
   */
  goToReviews(): void {
    this.router.navigate(['/craftsman-reviews']);
  }

  /**
   * Retry loading profile
   */
  retryLoad(): void {
    this.loadProfile();
  }
}


// Import environment at the bottom to avoid circular dependency
import { environment } from '../../../environments/environment';
