import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AvailabilityService } from '../../services/availability.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { ServiceRequestService } from '../../services/service-request.service';
import { TimeSlotDto, WeekDayView, DAYS_OF_WEEK } from '../../models/availability.models';
import { CraftsmanProfile } from '../../models/craftsman.models';

@Component({
    selector: 'app-appointment-scheduling',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './appointment-scheduling.html',
    styleUrl: './appointment-scheduling.scss'
})
export class AppointmentSchedulingComponent implements OnInit {
    craftsmanId: number = 0;
    serviceRequestId: number = 0;
    serviceDuration: number = 60;

    craftsman: CraftsmanProfile | null = null;
    weekDays: WeekDayView[] = [];
    selectedDay: WeekDayView | null = null;
    selectedTimeSlot: TimeSlotDto | null = null;
    availableSlots: TimeSlotDto[] = [];
    loadingSlots = false;
    slotsError: string | null = null;
    isBooking = false;
    loadingCraftsman = false;
    loadingWeek = false;

    private availabilityService = inject(AvailabilityService);
    private craftsmanService = inject(CraftsmanService);
    private serviceRequestService = inject(ServiceRequestService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.craftsmanId = +params['craftsmanId'] || 0;
            this.serviceRequestId = +params['serviceRequestId'] || 0;
            this.serviceDuration = +params['duration'] || 60;

            if (this.craftsmanId) {
                this.loadCraftsmanInfo();
                this.generateWeekView();
            }
        });
    }

    private loadCraftsmanInfo(): void {
        this.loadingCraftsman = true;
        this.craftsmanService.getCraftsmanById(this.craftsmanId)
            .subscribe({
                next: (craftsman: CraftsmanProfile) => {
                    this.craftsman = craftsman;
                    this.loadingCraftsman = false;
                },
                error: (error: any) => {
                    console.error('Error loading craftsman:', error);
                    this.loadingCraftsman = false;
                    alert('Failed to load craftsman information');
                }
            });
    }

    private generateWeekView(): void {
        this.loadingWeek = true;
        this.weekDays = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generate 7 days starting from today - all are clickable
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const dayOfWeek = date.getDay();
            const dayInfo = DAYS_OF_WEEK.find(d => d.value === dayOfWeek);

            const weekDay: WeekDayView = {
                date: date,
                dayOfWeek: dayOfWeek,
                dayName: dayInfo?.short || '',
                fullDayName: dayInfo?.name || '',
                dateString: date.getDate().toString(),
                isToday: i === 0,
                isAvailable: true, // All days are clickable
                availabilityData: undefined
            };

            this.weekDays.push(weekDay);
        }

        this.loadingWeek = false;
    }

    onDaySelected(day: WeekDayView): void {
        console.log(`Day selected: ${day.fullDayName}`, {
            craftsmanId: this.craftsmanId,
            date: day.date.toISOString(),
            duration: this.serviceDuration
        });

        this.selectedDay = day;
        this.selectedTimeSlot = null;
        this.loadingSlots = true;
        this.slotsError = null;
        this.availableSlots = [];

        // Fetch time slots using the /slots endpoint
        this.availabilityService.getTimeSlots(this.craftsmanId, day.date, this.serviceDuration)
            .subscribe({
                next: (slots: TimeSlotDto[]) => {
                    console.log('Time slots response:', slots);

                    this.availableSlots = slots;
                    this.loadingSlots = false;

                    if (slots.length === 0) {
                        this.slotsError = 'No time slots available for this day';
                    }
                },
                error: (error: any) => {
                    console.error(`Error loading time slots for ${day.fullDayName}:`, error);
                    this.slotsError = 'Failed to load time slots for this day';
                    this.loadingSlots = false;
                    this.availableSlots = [];
                }
            });
    }

    onSlotSelected(slot: TimeSlotDto): void {
        this.selectedTimeSlot = slot;
    }

    confirmBooking(): void {
        if (!this.selectedTimeSlot) {
            alert('Please select a time slot');
            return;
        }

        if (!this.serviceRequestId) {
            alert('Service request ID is missing');
            return;
        }

        this.isBooking = true;

        console.log('Booking appointment:', {
            serviceRequestId: this.serviceRequestId,
            craftsmanId: this.craftsmanId,
            appointmentTime: this.selectedTimeSlot.startTime,
            day: this.selectedDay?.fullDayName
        });

        setTimeout(() => {
            this.isBooking = false;
            alert(`Appointment booked successfully!\nCraftsman: ${this.craftsman?.fName} ${this.craftsman?.lName}\nDay: ${this.selectedDay?.fullDayName}\nTime: ${this.selectedTimeSlot?.time}`);
            this.router.navigate(['/']);
        }, 1500);
    }

    goBack(): void {
        this.router.navigate(['/craftsmen-list']);
    }
}
