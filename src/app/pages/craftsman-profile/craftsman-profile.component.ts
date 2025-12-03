import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CraftsmanService } from '../../services/craftsman.service';
import { ReviewService } from '../../services/review.service';
import { CraftsmanProfile, Gender, Review } from '../../models/craftsman.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-craftsman-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './craftsman-profile.component.html',
  styleUrl: './craftsman-profile.component.css'
})
export class CraftsmanProfileComponent implements OnInit {
  private craftsmanService = inject(CraftsmanService);
  private reviewService = inject(ReviewService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // Signals for reactive state management
  profile = signal<CraftsmanProfile | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  averageRating = signal<number>(0);
  totalReviews = signal<number>(0);
  reviews = signal<Review[]>([]);
  showReviews = signal<boolean>(false);

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

        // Fetch average rating if we have a craftsman ID
        if (data.id) {
          this.loadAverageRating(data.id);
        }

        // Load full response with reviews
        this.loadReviews();
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
   * Load average rating and review count from API
   */
  loadAverageRating(craftsmanId: number): void {
    console.log('🔍 Loading average rating for craftsman ID:', craftsmanId);
    console.log('📡 API URL will be:', `${environment.apiUrl}/Review/craftsman/${craftsmanId}/average-rating`);

    this.reviewService.getCraftsmanAverageRating(craftsmanId).subscribe({
      next: (data) => {
        console.log('✅ Average rating data received:', data);
        console.log('📊 Average Rating:', data.averageRating);
        console.log('📝 Total Reviews:', data.totalReviews);
        this.averageRating.set(data.averageRating);
        this.totalReviews.set(data.totalReviews);
        console.log('✅ Signals updated - averageRating:', this.averageRating(), 'totalReviews:', this.totalReviews());
      },
      error: (error) => {
        console.error('❌ Failed to load average rating:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Full error object:', error);
        // Keep default values (0) if fetch fails
      }
    });
  }

  /**
   * Load reviews from the API response
   */
  loadReviews(): void {
    const email = localStorage.getItem('email');
    if (!email) return;

    // Fetch the full response including reviews
    this.craftsmanService.getCraftsmanWithReviewsByEmail(email).subscribe({
      next: (response) => {
        console.log('📝 Reviews loaded:', response.reviews);
        this.reviews.set(response.reviews || []);
      },
      error: (error) => {
        console.error('❌ Failed to load reviews:', error);
        this.reviews.set([]);
      }
    });
  }

  /**
   * Toggle reviews display
   */
  toggleReviews(): void {
    this.showReviews.set(!this.showReviews());
  }

  /**
   * Get star array for a specific rating value
   */
  getStarArrayForRating(rating: number): { filled: number[], empty: number[] } {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    return {
      filled: Array(fullStars).fill(0).map((_, i) => i),
      empty: Array(emptyStars).fill(0).map((_, i) => i)
    };
  }

  /**
   * Format review date
   */
  formatReviewDate(dateString: string): string {
    if (!dateString || dateString.startsWith('0001-01-01')) {
      return this.translate.instant('CRAFTSMAN_PROFILE.RECENTLY');
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

      // If it's a full HTTP/HTTPS URL, clean up double slashes and return
      if (p.profileImage.startsWith('http://') || p.profileImage.startsWith('https://')) {
        // Fix double slashes in the URL (e.g., https://localhost:7058//images/... -> https://localhost:7058/images/...)
        const cleanedUrl = p.profileImage.replace(/([^:]\/)\/+/g, '$1');
        console.log('Cleaned image URL:', cleanedUrl);
        return cleanedUrl;
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
   * Uses average rating from API if available, otherwise falls back to profile rating
   */
  getStarArray(): { filled: number[], empty: number[] } {
    const rating = this.averageRating() || this.profile()?.rating || 0;
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
    return this.profile()?.isVerified ? this.translate.instant('CRAFTSMAN_PROFILE.VERIFIED') : this.translate.instant('CRAFTSMAN_PROFILE.NOT_VERIFIED');
  }

  /**
   * Retry loading profile
   */
  retryLoad(): void {
    this.loadProfile();
  }

  /**
   * Get rating value formatted to 1 decimal place
   */
  getRatingDisplay(): string {
    const rating = this.profile()?.rating || 0;
    return rating.toFixed(1);
  }
}
