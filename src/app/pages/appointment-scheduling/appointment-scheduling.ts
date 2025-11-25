import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AvailabilityService } from '../../services/availability.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { ServiceRequestService } from '../../services/service-request.service';
import { TimeSlotDto } from '../../models/availability.models';
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
    selectedDate: string = '';
    selectedTimeSlot: TimeSlotDto | null = null;
    availableSlots: TimeSlotDto[] = [];
    loadingSlots = false;
    slotsError: string | null = null;
    isBooking = false;
    loadingCraftsman = false;

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
            }
        });

        const today = new Date();
        this.selectedDate = today.toISOString().split('T')[0];
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

    onDateSelected(date: string): void {
        this.selectedDate = date;
        this.selectedTimeSlot = null;
        this.loadAvailableSlots();
    }

    onSlotSelected(slot: TimeSlotDto): void {
        this.selectedTimeSlot = slot;
    }

    private loadAvailableSlots(): void {
        if (!this.selectedDate) {
            return;
        }

        this.loadingSlots = true;
        this.slotsError = null;
        this.availableSlots = [];

        this.availabilityService.getAvailableSlots(this.craftsmanId, this.selectedDate, this.serviceDuration)
            .subscribe({
                next: (slots) => {
                    this.availableSlots = slots;
                    this.loadingSlots = false;

                    if (slots.length === 0) {
                        this.slotsError = 'No available slots for this date. Please select another date.';
                    }
                },
                error: (error) => {
                    console.error('Error loading slots:', error);
                    this.loadingSlots = false;
                    this.slotsError = 'Failed to load available time slots. Please try again.';
                }
            });
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
            date: this.selectedDate
        });

        setTimeout(() => {
            this.isBooking = false;
            alert(`Appointment booked successfully!\nCraftsman: ${this.craftsman?.fName} ${this.craftsman?.lName}\nDate: ${this.selectedDate}\nTime: ${this.selectedTimeSlot?.time}`);
            this.router.navigate(['/']);
        }, 1500);
    }

    goBack(): void {
        this.router.navigate(['/craftsmen-list']);
    }

    getMinDate(): string {
        return new Date().toISOString().split('T')[0];
    }
}
