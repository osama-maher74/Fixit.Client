import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { AvailabilityService } from '../../services/availability.service';
import { TimeSlotDto, TimeSlotStatus, canToggleSlot, isSlotBooked } from '../../models/availability.models';

@Component({
  selector: 'app-time-slots',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, RouterLink, TranslateModule],
  templateUrl: './time-slots.html',
  styleUrl: './time-slots.scss'
})
export class TimeSlotsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private availabilityService = inject(AvailabilityService);
  private snackBar = inject(MatSnackBar);

  // Signals
  craftsmanId = signal<number>(0);
  timeSlots = signal<TimeSlotDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  togglingSlotId = signal<number | null>(null);
  weekDays = signal<any[]>([]);
  selectedDate = signal<Date>(new Date());
  currentWeekStart = signal<Date>(new Date());

  // Expose status enum to template
  TimeSlotStatus = TimeSlotStatus;

  ngOnInit(): void {
    this.loadCraftsmanId();
    this.initCurrentWeek();
    this.generateWeekDays();
  }

  private loadCraftsmanId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.craftsmanId.set(+id);
      this.loadSlots();
    }
  }

  initCurrentWeek(): void {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    this.currentWeekStart.set(weekStart);
  }

  generateWeekDays(): void {
    const weekStart = this.currentWeekStart();
    const today = new Date();

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);

      days.push({
        date: date,
        dayName: this.getDayName(i),
        dayShort: this.getDayShort(i),
        dayNumber: date.getDate(),
        monthName: this.getMonthName(date.getMonth()),
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, this.selectedDate())
      });
    }

    this.weekDays.set(days);
  }

  selectDay(day: any): void {
    this.selectedDate.set(day.date);
    this.generateWeekDays(); // Refresh to update selected state
    this.loadSlots();
  }

  navigateWeek(direction: 'prev' | 'next'): void {
    const currentStart = this.currentWeekStart();
    const newStart = new Date(currentStart);
    newStart.setDate(currentStart.getDate() + (direction === 'next' ? 7 : -7));

    this.currentWeekStart.set(newStart);

    // Update selected date to the same day of week in the new week
    const selectedDay = this.selectedDate().getDay();
    const newSelected = new Date(newStart);
    newSelected.setDate(newStart.getDate() + selectedDay);
    this.selectedDate.set(newSelected);

    this.generateWeekDays();
    this.loadSlots();
  }

  private getDayName(index: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[index];
  }

  private getDayShort(index: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  }

  private getMonthName(index: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[index];
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  loadSlots(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.timeSlots.set([]);

    const dateObj = this.selectedDate();

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
