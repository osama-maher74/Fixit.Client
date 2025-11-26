import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CraftsmanService } from '../../services/craftsman.service';
import { CraftsmanProfile, Gender } from '../../models/craftsman.models';

@Component({
  selector: 'app-craftsman-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './craftsman-profile.component.html',
  styleUrl: './craftsman-profile.component.css'
})
export class CraftsmanProfileComponent implements OnInit {
  private craftsmanService = inject(CraftsmanService);
  private router = inject(Router);

  // Signals for reactive state management
  profile = signal<CraftsmanProfile | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Expose Gender enum to template
  Gender = Gender;

  ngOnInit(): void {
    this.loadProfile();
  }

  /**
   * Load the current user's profile
   */
  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Debug: Check if email exists in localStorage
    const email = localStorage.getItem('email');
    console.log('Craftsman Profile Component - Email from localStorage:', email);
    console.log('Craftsman Profile Component - All localStorage:', { ...localStorage });

    this.craftsmanService.getCurrentUserProfile().subscribe({
      next: (data) => {
        console.log('Craftsman Profile Component - Profile data received:', data);
        this.profile.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Craftsman Profile Component - Error loading profile:', error);
        console.error('Craftsman Profile Component - Error status:', error.status);
        console.error('Craftsman Profile Component - Error message:', error.message);

        this.errorMessage.set(
          error.message || 'Failed to load profile. Please try again.'
        );
        this.isLoading.set(false);

        // If user is not logged in, redirect to login
        if (error.message === 'No logged-in user found') {
          console.log('Craftsman Profile Component - No email found, redirecting to login in 5 seconds...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 5000);
        }
      }
    });
  }

  /**
   * Get full name
   */
  getFullName(): string {
    const p = this.profile();
    return p ? `${p.fName} ${p.lName}` : '';
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
   * Get star rating display (full stars and empty stars)
   */
  getStarArray(): { filled: number[], empty: number[] } {
    const p = this.profile();
    const rating = p?.rating || 0;
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    return {
      filled: Array(fullStars).fill(0).map((_, i) => i),
      empty: Array(emptyStars).fill(0).map((_, i) => i)
    };
  }

  /**
   * Get verification badge text
   */
  getVerificationText(): string {
    return this.profile()?.isVerified ? 'Verified' : 'Not Verified';
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
