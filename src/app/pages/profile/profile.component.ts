import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { ClientProfile } from '../../models/client.models';
import { CraftsmanProfile } from '../../models/craftsman.models';

type UserProfile = ClientProfile | CraftsmanProfile;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private clientService = inject(ClientService);
  private craftsmanService = inject(CraftsmanService);
  private router = inject(Router);

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
    return p.gender === 0 ? 'Male' : 'Female';
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
    return p?.isVerified ? 'Verified' : 'Not Verified';
  }

  /**
   * Get profile image URL or default avatar
   */
  getProfileImageUrl(): string {
    const p = this.profile();
    if (p?.profileImage && p.profileImage.trim() !== '') {
      console.log('Profile image path from backend:', p.profileImage);

      // If it's a full HTTP/HTTPS URL, return as is
      if (p.profileImage.startsWith('http://') || p.profileImage.startsWith('https://')) {
        return p.profileImage;
      }

      // If it's a local file path, extract filename and construct API URL
      let fileName = p.profileImage;

      // Extract filename from Windows path (handles both \ and /)
      if (fileName.includes('\\')) {
        fileName = fileName.split('\\').pop() || fileName;
      } else if (fileName.includes('/')) {
        fileName = fileName.split('/').pop() || fileName;
      }

      console.log('Extracted filename:', fileName);

      // Construct the URL - ASP.NET Core serves static files from wwwroot without /api prefix
      // So if image is in wwwroot/Images/default.png, the URL is https://localhost:7058/Images/default.png
      const imageUrl = `https://localhost:7058/Images/${fileName}`;
      console.log('Constructed image URL:', imageUrl);

      return imageUrl;
    }

    // Default avatar SVG with gray color
    console.log('No profile image, using default avatar');
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="%239CA3AF"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /%3E%3C/svg%3E';
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
