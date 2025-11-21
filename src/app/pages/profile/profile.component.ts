import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { ClientProfile, Gender } from '../../models/client.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private clientService = inject(ClientService);
  private router = inject(Router);

  // Signals for reactive state management
  profile = signal<ClientProfile | null>(null);
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
    console.log('Profile Component - Email from localStorage:', email);
    console.log('Profile Component - All localStorage:', { ...localStorage });

    this.clientService.getCurrentUserProfile().subscribe({
      next: (data) => {
        console.log('Profile Component - Profile data received:', data);
        this.profile.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Profile Component - Error loading profile:', error);
        console.error('Profile Component - Error status:', error.status);
        console.error('Profile Component - Error message:', error.message);

        this.errorMessage.set(
          error.message || 'Failed to load profile. Please try again.'
        );
        this.isLoading.set(false);

        // If user is not logged in, redirect to login
        if (error.message === 'No logged-in user found') {
          console.log('Profile Component - No email found, redirecting to login in 5 seconds...');
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
   * Get gender display text
   */
  getGenderText(): string {
    const p = this.profile();
    return p?.gender === Gender.Male ? 'Male' : 'Female';
  }

  /**
   * Get profile image URL or default avatar
   */
  getProfileImageUrl(): string {
    const p = this.profile();
    if (p?.profileImage) {
      // If it's a full URL, return as is
      if (p.profileImage.startsWith('http')) {
        return p.profileImage;
      }
      // Otherwise, construct the full URL
      return `${environment.apiUrl}/${p.profileImage}`;
    }
    // Default avatar SVG with gray color
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
