import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceRequestService, CreateServiceRequestDto } from '../../services/service-request.service';
import { ServiceService } from '../../services/service.service';
import { ServiceCard } from '../service-card/service-card.component';
import { TimeSlotDto } from '../../models/availability.models';

export interface BookingDialogData {
  slot: TimeSlotDto;
  craftsmanId: number;
  craftsmanName?: string;
}

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.css'
})
export class BookingModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private serviceRequestService = inject(ServiceRequestService);
  private serviceService = inject(ServiceService);
  public dialogRef = inject(MatDialogRef<BookingModalComponent>);
  public data = inject<BookingDialogData>(MAT_DIALOG_DATA);

  // Signals
  services = signal<ServiceCard[]>([]);
  isLoadingServices = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Form
  bookingForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadServices();
  }

  private initForm(): void {
    // Get client ID from localStorage
    const userStr = localStorage.getItem('current_user');
    let clientId = 0;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        clientId = user.id || 0;
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    this.bookingForm = this.fb.group({
      clientId: [clientId, Validators.required],
      serviceId: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      location: [''],
      suggestedPrice: [null, [Validators.min(0)]]
    });
  }

  private loadServices(): void {
    this.isLoadingServices.set(true);
    this.serviceService.getAllServices().subscribe({
      next: (services) => {
        this.services.set(services);
        this.isLoadingServices.set(false);
      },
      error: (error: any) => {
        console.error('Error loading services:', error);
        this.errorMessage.set('Failed to load services');
        this.isLoadingServices.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const dto: CreateServiceRequestDto = {
      clientId: this.bookingForm.value.clientId,
      serviceId: +this.bookingForm.value.serviceId,
      description: this.bookingForm.value.description,
      location: this.bookingForm.value.location || undefined,
      suggestedPrice: this.bookingForm.value.suggestedPrice || undefined
    };

    this.serviceRequestService.createServiceRequest(dto).subscribe({
      next: (response) => {
        console.log('Booking created successfully:', response);
        this.isSubmitting.set(false);
        // Close dialog and return success
        this.dialogRef.close({ success: true, data: response });
      },
      error: (error: any) => {
        console.error('Error creating booking:', error);
        this.isSubmitting.set(false);

        // Handle specific errors
        if (error.status === 409) {
          this.errorMessage.set('This time slot has already been booked. Please select another slot.');
        } else {
          this.errorMessage.set(error.error?.message || 'Failed to create booking. Please try again.');
        }
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  // Format time for display
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString();
  }

  hasError(fieldName: string): boolean {
    const field = this.bookingForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.bookingForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    return 'Invalid value';
  }
}
