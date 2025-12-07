import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AvailabilityService } from '../../services/availability.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { ThemeService } from '../../services/theme.service';
import { getSwalThemeConfig } from '../../helpers/swal-theme.helper';
import Swal from 'sweetalert2';
import {
  AvailabilityDto,
  CreateAvailabilityDto,
  DAYS_OF_WEEK,
  formatTime12Hour
} from '../../models/availability.models';

@Component({
  selector: 'app-availability-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './availability-editor.html',
  styleUrl: './availability-editor.scss'
})
export class AvailabilityEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private availabilityService = inject(AvailabilityService);
  private craftsmanService = inject(CraftsmanService);
  private themeService = inject(ThemeService);

  // Signals
  craftsmanId = signal<number>(0);
  availabilities = signal<AvailabilityDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form
  availabilityForm!: FormGroup;

  // Expose constants to template
  daysOfWeek = DAYS_OF_WEEK;

  ngOnInit(): void {
    this.initForm();
    this.loadCraftsmanId();
  }

  private initForm(): void {
    this.availabilityForm = this.fb.group({
      dayOfWeek: [0, Validators.required],
      startTime: ['09:00', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      endTime: ['17:00', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      isAvailable: [true]
    });
  }

  private loadCraftsmanId(): void {
    // First check if there's an ID in the route (for admin/viewing other craftsmen)
    const routeId = this.route.snapshot.paramMap.get('id');

    if (routeId) {
      // Admin viewing another craftsman's availability
      this.craftsmanId.set(+routeId);
      this.loadAvailability();
    } else {
      // Get current logged-in craftsman's ID
      this.craftsmanService.getCurrentUserProfile().subscribe({
        next: (craftsman) => {
          console.log('✅ Loaded craftsman profile:', craftsman);
          this.craftsmanId.set(craftsman.id);
          this.loadAvailability();
        },
        error: (error) => {
          console.error('❌ Failed to load craftsman profile:', error);
          this.errorMessage.set('Failed to load your profile. Please try logging in again.');
        }
      });
    }
  }

  private loadAvailability(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.availabilityService.getCraftsmanAvailability(this.craftsmanId()).subscribe({
      next: (data) => {
        // Backend already provides dayName, startTimeFormatted, endTimeFormatted
        this.availabilities.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading availability:', error);
        this.errorMessage.set(error.error?.message || 'Failed to load availability');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.availabilityForm.invalid) {
      Object.keys(this.availabilityForm.controls).forEach(key => {
        this.availabilityForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Validate end time > start time
    const startTime = this.availabilityForm.value.startTime;
    const endTime = this.availabilityForm.value.endTime;
    if (endTime <= startTime) {
      this.errorMessage.set('End time must be after start time');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const dto: CreateAvailabilityDto = {
      craftsManId: this.craftsmanId(),
      dayOfWeek: Number(this.availabilityForm.value.dayOfWeek), // ✅ Ensure integer
      startTime: this.availabilityForm.value.startTime,
      endTime: this.availabilityForm.value.endTime,
      isAvailable: this.availabilityForm.value.isAvailable
    };

    this.availabilityService.createAvailability(dto).subscribe({
      next: () => {
        this.successMessage.set('Availability added successfully!');
        this.isSaving.set(false);
        this.availabilityForm.reset({
          dayOfWeek: 0,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        });
        this.loadAvailability(); // Refresh list
      },
      error: (error: any) => {
        console.error('Error creating availability:', error);
        this.errorMessage.set(error.error?.message || 'Failed to create availability');
        this.isSaving.set(false);
      }
    });
  }

  deleteAvailability(id: number, dayName: string): void {
    const isDark = this.themeService.isDark();

    Swal.fire({
      ...getSwalThemeConfig(isDark),
      title: 'Are you sure?',
      text: `Do you really want to remove this slot for ${dayName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#ef4444', // Red for delete action
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.availabilityService.deleteAvailability(id).subscribe({
          next: () => {
            Swal.fire({
              ...getSwalThemeConfig(isDark),
              title: 'Deleted!',
              text: 'Your availability slot has been removed.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.successMessage.set('Availability deleted successfully!');
            this.loadAvailability(); // Refresh list
          },
          error: (error: any) => {
            console.error('Error deleting availability:', error);
            Swal.fire({
              ...getSwalThemeConfig(isDark),
              title: 'Error!',
              text: error.error?.message || 'Failed to delete availability.',
              icon: 'error'
            });
            this.errorMessage.set(error.error?.message || 'Failed to delete availability');
          }
        });
      }
    });
  }

  // Group availabilities by day for display
  getAvailabilityByDay(dayOfWeek: number): AvailabilityDto[] {
    return this.availabilities().filter(a => a.dayOfWeek === dayOfWeek);
  }

  hasError(fieldName: string): boolean {
    const field = this.availabilityForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.availabilityForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['pattern']) return 'Invalid time format (HH:MM)';
    return 'Invalid value';
  }

  // Format time to 12-hour format with AM/PM
  formatTime(time: string): string {
    return formatTime12Hour(time);
  }
}
