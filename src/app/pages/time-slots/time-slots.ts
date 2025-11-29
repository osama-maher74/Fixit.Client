import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { AvailabilityService } from '../../services/availability.service';
import { TimeSlotDto } from '../../models/availability.models';
import { BookingModalComponent, BookingDialogData } from '../../components/booking-modal/booking-modal';

@Component({
  selector: 'app-time-slots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatSnackBarModule, RouterLink, TranslateModule],
  templateUrl: './time-slots.html',
  styleUrl: './time-slots.scss'
})
export class TimeSlotsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private availabilityService = inject(AvailabilityService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals
  craftsmanId = signal<number>(0);
  timeSlots = signal<TimeSlotDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Form
  selectionForm!: FormGroup;

  // Duration options
  durationOptions = [30, 60, 90, 120];

  ngOnInit(): void {
    this.initForm();
    this.loadCraftsmanId();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.selectionForm = this.fb.group({
      date: [today, Validators.required],
      duration: [60, Validators.required]
    });
  }

  private loadCraftsmanId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.craftsmanId.set(+id);
      this.searchSlots(); // Load immediate
    }
  }

  searchSlots(): void {
    if (this.selectionForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.timeSlots.set([]);

    const { date } = this.selectionForm.value;
    const dateObj = new Date(date);

    this.availabilityService.getTimeSlots(
      this.craftsmanId(),
      dateObj
    ).subscribe({
      next: (slots) => {
        // Filter only available slots
        const availableSlots = slots.filter(slot => slot.status === 'Available');
        this.timeSlots.set(availableSlots);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading time slots:', error);
        this.errorMessage.set(error.error?.message || 'Failed to load time slots');
        this.isLoading.set(false);
      }
    });
  }

  selectSlot(slot: TimeSlotDto): void {
    if (slot.status !== 'Available') {
      return;
    }

    // Open booking modal dialog
    const dialogData: BookingDialogData = {
      slot: slot,
      craftsmanId: this.craftsmanId(),
      craftsmanName: undefined // Can be added if you have craftsman name
    };

    const dialogRef = this.dialog.open(BookingModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'booking-modal-dialog',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Booking created successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        // Optionally refresh slots
        this.searchSlots();
      }
    });
  }

  // Count available slots
  availableSlotsCount(): number {
    return this.timeSlots().filter(slot => slot.status === 'Available').length;
  }
}
