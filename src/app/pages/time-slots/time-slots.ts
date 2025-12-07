import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { AvailabilityService } from '../../services/availability.service';
import { TimeSlotDto, TimeSlotStatus, canToggleSlot, isSlotBooked } from '../../models/availability.models';

@Component({
  selector: 'app-time-slots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterLink, TranslateModule],
  templateUrl: './time-slots.html',
  styleUrl: './time-slots.scss'
})
export class TimeSlotsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private availabilityService = inject(AvailabilityService);
  private snackBar = inject(MatSnackBar);

  // Signals
  craftsmanId = signal<number>(0);
  timeSlots = signal<TimeSlotDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  togglingSlotId = signal<number | null>(null); // Track which slot is being toggled

  // Form
  dateForm!: FormGroup;

  // Expose status enum to template
  TimeSlotStatus = TimeSlotStatus;

  ngOnInit(): void {
    this.initForm();
    this.loadCraftsmanId();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dateForm = this.fb.group({
      date: [today, Validators.required]
    });

    // Auto-load slots when date changes
    this.dateForm.get('date')?.valueChanges.subscribe(() => {
      this.loadSlots();
    });
  }

  private loadCraftsmanId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.craftsmanId.set(+id);
      this.loadSlots(); // Load immediately
    }
  }

  loadSlots(): void {
    if (this.dateForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.timeSlots.set([]);

    const { date } = this.dateForm.value;
    const dateObj = new Date(date);

    this.availabilityService.getTimeSlots(
      this.craftsmanId(),
      dateObj
    ).subscribe({
      next: (slots) => {
        // Show ALL slots (Available, Booked, and Disabled)
        this.timeSlots.set(slots);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading time slots:', error);
        this.errorMessage.set(error.error?.message || 'Failed to load time slots');
        this.isLoading.set(false);
      }
    });
  }

  toggleSlot(slot: TimeSlotDto): void {
    // Only allow toggling Available <-> Disabled (not Booked)
    if (!canToggleSlot(slot.status)) {
      return;
    }

    // Optimistic UI Update: Store original state
    const originalStatus = slot.status;
    const optimisticStatus = slot.status === TimeSlotStatus.Available
      ? TimeSlotStatus.Disabled
      : TimeSlotStatus.Available;

    // Update UI immediately
    const updatedSlots = this.timeSlots().map(s =>
      s.id === slot.id ? { ...s, status: optimisticStatus } : s
    );
    this.timeSlots.set(updatedSlots);
    this.togglingSlotId.set(slot.id);

    // Call API
    this.availabilityService.toggleSlotStatus(slot.id, this.craftsmanId()).subscribe({
      next: (updatedSlot) => {
        // Update with actual response from backend
        const finalSlots = this.timeSlots().map(s =>
          s.id === updatedSlot.id ? updatedSlot : s
        );
        this.timeSlots.set(finalSlots);
        this.togglingSlotId.set(null);

        // Show success notification
        const action = updatedSlot.status === TimeSlotStatus.Disabled ? 'blocked' : 'activated';
        this.snackBar.open(`Time slot ${action} successfully!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error: any) => {
        console.error('Error toggling slot:', error);

        // Revert optimistic update
        const revertedSlots = this.timeSlots().map(s =>
          s.id === slot.id ? { ...s, status: originalStatus } : s
        );
        this.timeSlots.set(revertedSlots);
        this.togglingSlotId.set(null);

        // Show error notification
        this.snackBar.open(
          error.error?.message || 'Failed to update time slot. Please try again.',
          'Close',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  // Helper methods for template
  canToggle(slot: TimeSlotDto): boolean {
    return canToggleSlot(slot.status);
  }

  isBooked(slot: TimeSlotDto): boolean {
    return isSlotBooked(slot.status);
  }

  isToggling(slotId: number): boolean {
    return this.togglingSlotId() === slotId;
  }

  // Slot count methods
  availableSlotsCount(): number {
    return this.timeSlots().filter(slot => slot.status === TimeSlotStatus.Available).length;
  }

  disabledSlotsCount(): number {
    return this.timeSlots().filter(slot => slot.status === TimeSlotStatus.Disabled).length;
  }

  bookedSlotsCount(): number {
    return this.timeSlots().filter(slot => slot.status === TimeSlotStatus.Booked).length;
  }
}
