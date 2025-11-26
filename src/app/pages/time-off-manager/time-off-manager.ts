import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AvailabilityService } from '../../services/availability.service';
import { TimeOffDto, CreateTimeOffDto } from '../../models/availability.models';

@Component({
  selector: 'app-time-off-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './time-off-manager.html',
  styleUrl: './time-off-manager.css'
})
export class TimeOffManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private availabilityService = inject(AvailabilityService);

  // Signals
  craftsmanId = signal<number>(0);
  timeOffList = signal<TimeOffDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form
  timeOffForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadCraftsmanId();
  }

  private initForm(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.timeOffForm = this.fb.group({
      startDateTime: [now.toISOString().slice(0, 16), Validators.required],
      endDateTime: [tomorrow.toISOString().slice(0, 16), Validators.required],
      reason: ['']
    });
  }

  private loadCraftsmanId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.craftsmanId.set(+id);
      this.loadTimeOff();
    }
  }

  private loadTimeOff(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.availabilityService.getCraftsmanTimeOff(this.craftsmanId()).subscribe({
      next: (data) => {
        this.timeOffList.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading time-off:', error);
        this.errorMessage.set(error.error?.message || 'Failed to load time-off entries');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.timeOffForm.invalid) {
      return;
    }

    const startDateTime = this.timeOffForm.value.startDateTime;
    const endDateTime = this.timeOffForm.value.endDateTime;

    // Validate end > start
    if (new Date(endDateTime) <= new Date(startDateTime)) {
      this.errorMessage.set('End date must be after start date');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const dto: CreateTimeOffDto = {
      craftsManId: this.craftsmanId(),
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      reason: this.timeOffForm.value.reason || undefined
    };

    this.availabilityService.createTimeOff(dto).subscribe({
      next: () => {
        this.successMessage.set('Time-off added successfully!');
        this.isSaving.set(false);
        this.timeOffForm.reset();
        this.initForm(); // Reset to defaults
        this.loadTimeOff(); // Refresh list
      },
      error: (error: any) => {
        console.error('Error creating time-off:', error);
        this.errorMessage.set(error.error?.message || 'Failed to create time-off');
        this.isSaving.set(false);
      }
    });
  }

  deleteTimeOff(id: number): void {
    if (!confirm('Delete this time-off entry?')) {
      return;
    }

    this.availabilityService.deleteTimeOff(id).subscribe({
      next: () => {
        this.successMessage.set('Time-off deleted successfully!');
        this.loadTimeOff();
      },
      error: (error: any) => {
        console.error('Error deleting time-off:', error);
        this.errorMessage.set(error.error?.message || 'Failed to delete time-off');
      }
    });
  }

  formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString();
  }
}
