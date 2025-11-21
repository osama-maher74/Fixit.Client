import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { ClientProfile, Gender } from '../../models/client.models';
import { CraftsmanProfile } from '../../models/craftsman.models';

type UserProfile = ClientProfile | CraftsmanProfile;

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private craftsmanService = inject(CraftsmanService);
  private router = inject(Router);

  // Signals for reactive state management
  userRole = signal<'client' | 'craftsman' | null>(null);
  profile = signal<UserProfile | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  selectedImageFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);

  // Forms
  clientForm!: FormGroup;
  craftsmanForm!: FormGroup;

  // Expose Gender enum for template
  Gender = Gender;

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
  }

  /**
   * Initialize reactive forms
   */
  private initForms(): void {
    // Client Form
    this.clientForm = this.fb.group({
      fName: ['', [Validators.required, Validators.minLength(2)]],
      lName: ['', [Validators.required, Validators.minLength(2)]],
      location: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-() ]+$/)]],
      gender: [Gender.Male, Validators.required]
    });

    // Craftsman Form
    this.craftsmanForm = this.fb.group({
      fName: ['', [Validators.required, Validators.minLength(2)]],
      lName: ['', [Validators.required, Validators.minLength(2)]],
      describtion: ['', [Validators.required, Validators.minLength(10)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-() ]+$/)]],
      experienceOfYears: [0, [Validators.required, Validators.min(0)]],
      hourlyRate: [0, [Validators.required, Validators.min(0)]]
    });
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
   * Load current user's profile and populate form
   */
  private loadUserProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const role = this.getUserRole();

    if (!role) {
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
          console.log('Edit Profile - Craftsman profile loaded:', data);
          this.profile.set(data);
          this.populateCraftsmanForm(data);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.handleLoadError(error);
        }
      });
    } else {
      this.clientService.getCurrentUserProfile().subscribe({
        next: (data: ClientProfile) => {
          console.log('Edit Profile - Client profile loaded:', data);
          this.profile.set(data);
          this.populateClientForm(data);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.handleLoadError(error);
        }
      });
    }
  }

  /**
   * Populate client form with existing data
   */
  private populateClientForm(profile: ClientProfile): void {
    this.clientForm.patchValue({
      fName: profile.fName || '',
      lName: profile.lName || '',
      location: profile.location || '',
      phoneNumber: profile.phoneNumber || '',
      gender: profile.gender ?? Gender.Male
    });

    // Set image preview if exists
    if (profile.profileImage) {
      this.imagePreviewUrl.set(this.getProfileImageUrl(profile.profileImage));
    }
  }

  /**
   * Populate craftsman form with existing data
   */
  private populateCraftsmanForm(profile: CraftsmanProfile): void {
    this.craftsmanForm.patchValue({
      fName: profile.fName || '',
      lName: profile.lName || '',
      describtion: profile.describtion || '',
      phoneNumber: profile.phoneNumber || '',
      experienceOfYears: profile.experienceOfYears || 0,
      hourlyRate: profile.hourlyRate || 0
    });

    // Set image preview if exists
    if (profile.profileImage) {
      this.imagePreviewUrl.set(this.getProfileImageUrl(profile.profileImage));
    }
  }

  /**
   * Get profile image URL from path
   */
  private getProfileImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Backend returns the path like /images/ProfilePics/699cd57a-cbcc-4c81-a777-28af484aa6d6.png
    // Just prepend the base URL
    return `https://localhost:7058${imagePath}`;
  }

  /**
   * Handle profile load error
   */
  private handleLoadError(error: any): void {
    console.error('Edit Profile - Error loading profile:', error);
    this.errorMessage.set(error.message || 'Failed to load profile');
    this.isLoading.set(false);

    if (error.message === 'No logged-in user found') {
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }
  }

  /**
   * Handle image file selection
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage.set('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set('Image size must be less than 5MB');
        return;
      }

      this.selectedImageFile.set(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      this.errorMessage.set(null);
    }
  }

  /**
   * Remove selected image and revert to original
   */
  removeImage(): void {
    this.selectedImageFile.set(null);

    // Revert to original profile image if it exists
    const profile = this.profile();
    if (profile?.profileImage) {
      this.imagePreviewUrl.set(this.getProfileImageUrl(profile.profileImage));
    } else {
      this.imagePreviewUrl.set(null);
    }

    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Submit client form
   */
  onSubmitClient(): void {
    if (this.clientForm.invalid) {
      Object.keys(this.clientForm.controls).forEach(key => {
        this.clientForm.get(key)?.markAsTouched();
      });
      return;
    }

    const profile = this.profile() as ClientProfile;
    if (!profile) {
      this.errorMessage.set('Profile data not loaded');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Create FormData - field names must match backend DTO exactly
    const formData = new FormData();
    formData.append('id', profile.id.toString());
    formData.append('fName', this.clientForm.value.fName || '');
    formData.append('lName', this.clientForm.value.lName || '');
    formData.append('location', this.clientForm.value.location || '');
    formData.append('phoneNumber', this.clientForm.value.phoneNumber || '');
    formData.append('gender', (this.clientForm.value.gender ?? Gender.Male).toString());

    // Handle profile image
    if (this.selectedImageFile()) {
      // New image selected - send the file
      formData.append('profileImage', this.selectedImageFile()!);
    } else if (profile.profileImage) {
      // No new image - send old image path as text so backend knows to keep it
      formData.append('existingImagePath', profile.profileImage);
    }

    // Submit to API
    this.clientService.updateClient(profile.id, formData).subscribe({
      next: (updatedProfile) => {
        console.log('Client profile updated successfully:', updatedProfile);
        this.successMessage.set('Profile updated successfully!');
        this.isSaving.set(false);

        // Redirect to profile page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error updating client profile:', error);
        this.errorMessage.set(error.error?.message || 'Failed to update profile');
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Submit craftsman form
   */
  onSubmitCraftsman(): void {
    if (this.craftsmanForm.invalid) {
      Object.keys(this.craftsmanForm.controls).forEach(key => {
        this.craftsmanForm.get(key)?.markAsTouched();
      });
      return;
    }

    const profile = this.profile() as CraftsmanProfile;
    if (!profile) {
      this.errorMessage.set('Profile data not loaded');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Create FormData - field names must match backend DTO exactly
    const formData = new FormData();
    formData.append('id', profile.id.toString());
    formData.append('fName', this.craftsmanForm.value.fName || '');
    formData.append('lName', this.craftsmanForm.value.lName || '');
    formData.append('describtion', this.craftsmanForm.value.describtion || '');
    formData.append('phoneNumber', this.craftsmanForm.value.phoneNumber || '');
    formData.append('experienceOfYears', (this.craftsmanForm.value.experienceOfYears || 0).toString());
    formData.append('hourlyRate', (this.craftsmanForm.value.hourlyRate || 0).toString());

    // Handle profile image
    if (this.selectedImageFile()) {
      // New image selected - send the file
      formData.append('profileImage', this.selectedImageFile()!);
    } else if (profile.profileImage) {
      // No new image - send old image path as text so backend knows to keep it
      formData.append('existingImagePath', profile.profileImage);
    }

    // Submit to API
    this.craftsmanService.updateCraftsman(profile.id, formData).subscribe({
      next: (updatedProfile) => {
        console.log('Craftsman profile updated successfully:', updatedProfile);
        this.successMessage.set('Profile updated successfully!');
        this.isSaving.set(false);

        // Redirect to profile page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error updating craftsman profile:', error);
        this.errorMessage.set(error.error?.message || 'Failed to update profile');
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Cancel and go back to profile
   */
  onCancel(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Check if form field has error
   */
  hasError(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    if (field.errors['pattern']) return 'Invalid format';

    return 'Invalid value';
  }

  /**
   * Check if user is client
   */
  isClient(): boolean {
    return this.userRole() === 'client';
  }

  /**
   * Check if user is craftsman
   */
  isCraftsman(): boolean {
    return this.userRole() === 'craftsman';
  }
}
