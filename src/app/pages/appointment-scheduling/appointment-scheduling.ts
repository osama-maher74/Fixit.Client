import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AvailabilityService } from '../../services/availability.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { ServiceRequestService, ConfirmStartAtTimeDto } from '../../services/service-request.service';
import { OfferService } from '../../services/offer.service';
import { ClientService } from '../../services/client.service';
import { ThemeService } from '../../services/theme.service';
import { ReviewService, ReviewResponse, AverageRatingResponse } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { getSwalThemeConfig } from '../../helpers/swal-theme.helper';
import { TimeSlotDto, WeekDayView, DAYS_OF_WEEK } from '../../models/availability.models';
import { CraftsmanProfile } from '../../models/craftsman.models';
import { ClientProfile } from '../../models/client.models';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-appointment-scheduling',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './appointment-scheduling.html',
    styleUrl: './appointment-scheduling.scss'
})
export class AppointmentSchedulingComponent implements OnInit {
    craftsmanId: number = 0;
    serviceRequestId: number = 0;
    serviceDuration: number = 60;
    serviceId: number = 0;
    clientId: number = 0;
    location: string = '';
    serviceName: string = '';

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

    // Reviews
    reviews: ReviewResponse[] = [];
    averageRating: AverageRatingResponse | null = null;
    loadingReviews = false;
    reviewsError: string | null = null;
    Math = Math;

    private availabilityService = inject(AvailabilityService);
    private craftsmanService = inject(CraftsmanService);
    private serviceRequestService = inject(ServiceRequestService);
    private offerService = inject(OfferService);
    private clientService = inject(ClientService);
    private themeService = inject(ThemeService);
    private reviewService = inject(ReviewService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    ngOnInit(): void {
        console.log('🚀 AppointmentScheduling Component Initialized');
        console.log('🔐 Auth Status:', localStorage.getItem('auth_token') ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

        // Check authentication
        if (!this.authService.isAuthenticated()) {
            console.error('❌ User not authenticated, redirecting to login');
            Swal.fire({
                ...getSwalThemeConfig(this.themeService.isDark()),
                icon: 'warning',
                title: 'تسجيل الدخول مطلوب',
                text: 'يجب تسجيل الدخول أولاً لحجز موعد',
                confirmButtonText: 'حسناً'
            }).then(() => {
                this.router.navigate(['/login'], {
                    queryParams: { returnUrl: this.router.url }
                });
            });
            return;
        }

        this.route.queryParams.subscribe(params => {
            console.log('📋 Query Params:', params);

            this.craftsmanId = +params['craftsmanId'] || 0;
            this.serviceRequestId = +params['serviceRequestId'] || 0;
            this.serviceDuration = +params['duration'] || 60;
            this.serviceId = +params['serviceId'] || 0;
            this.location = params['location'] || '';
            this.serviceName = params['serviceName'] || '';

            console.log('✅ Parsed Params:', {
                craftsmanId: this.craftsmanId,
                serviceRequestId: this.serviceRequestId,
                serviceId: this.serviceId,
                location: this.location,
                serviceName: this.serviceName
            });

            // Get client profile to ensure we have the correct ID
            this.fetchClientProfile();

            if (this.craftsmanId) {
                console.log('📞 Loading craftsman info, week view, and reviews...');
                this.loadCraftsmanInfo();
                this.generateWeekView();
                this.loadCraftsmanReviews();
            } else {
                console.error('❌ No craftsman ID provided!');
            }
        });
    }

    private fetchClientProfile(): void {
        console.log('🔍 Fetching client profile...');
        console.log('🔑 Current token:', localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING');
        console.log('👤 Current user:', localStorage.getItem('current_user'));

        this.clientService.getCurrentUserProfile().subscribe({
            next: (profile: ClientProfile) => {
                console.log('✅ Client profile loaded successfully:', profile);
                this.clientId = profile.id;
            },
            error: (error) => {
                console.error('❌ ERROR loading client profile:', error);
                console.error('❌ Error status:', error?.status);
                console.error('❌ Error message:', error?.message);

                // Show error to user instead of silent fail
                Swal.fire({
                    ...getSwalThemeConfig(this.themeService.isDark()),
                    icon: 'error',
                    title: 'خطأ',
                    text: 'فشل تحميل بيانات الحساب. سيتم إعادة توجيهك للصفحة الرئيسية.',
                    confirmButtonText: 'حسناً'
                }).then(() => {
                    this.router.navigate(['/']);
                });
            }
        });
    }

    private loadCraftsmanInfo(): void {
        this.loadingCraftsman = true;
        this.craftsmanService.getCraftsmanById(this.craftsmanId)
            .subscribe({
                next: (craftsman: CraftsmanProfile) => {
                    // Format rating to 1 decimal place
                    if (craftsman.rating) {
                        craftsman.rating = parseFloat(craftsman.rating.toFixed(1));
                    }
                    if (craftsman.averageRating) {
                        craftsman.averageRating = parseFloat(craftsman.averageRating.toFixed(1));
                    }

                    this.craftsman = craftsman;
                    this.loadingCraftsman = false;
                },
                error: (error: any) => {
                    console.error('Error loading craftsman:', error);
                    this.loadingCraftsman = false;
                    Swal.fire({
                        ...getSwalThemeConfig(this.themeService.isDark()),
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to load craftsman information'
                    });
                }
            });
    }

    private generateWeekView(): void {
        this.loadingWeek = true;
        this.weekDays = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
                isAvailable: true,
                availabilityData: undefined
            };

            this.weekDays.push(weekDay);
        }

        this.loadingWeek = false;
    }

    onDaySelected(day: WeekDayView): void {
        this.selectedDay = day;
        this.selectedTimeSlot = null;
        this.loadingSlots = true;
        this.slotsError = null;
        this.availableSlots = [];

        this.availabilityService.getTimeSlots(this.craftsmanId, day.date)
            .subscribe({
                next: (slots: TimeSlotDto[]) => {
                    // Show all slots (both available and booked)
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
            Swal.fire({
                ...getSwalThemeConfig(this.themeService.isDark()),
                icon: 'warning',
                title: 'No Time Slot Selected',
                text: 'Please select a time slot before confirming'
            });
            return;
        }

        if (!this.serviceRequestId) {
            Swal.fire({
                ...getSwalThemeConfig(this.themeService.isDark()),
                icon: 'error',
                title: 'Error',
                text: 'Service request ID is missing'
            });
            return;
        }

        this.isBooking = true;

        // First, create the offer by selecting the craftsman
        const selectCraftsmanData = {
            serviceRequestId: this.serviceRequestId,
            craftsmanId: this.craftsmanId
        };

        this.offerService.selectCraftsman(selectCraftsmanData)
            .subscribe({
                next: () => {
                    console.log('Craftsman selected and offer created');

                    // Convert time from "09:00 AM" format to ISO 8601 datetime string
                    const timeString = this.selectedTimeSlot!.time; // e.g., "09:00 AM"
                    const dateString = this.selectedTimeSlot!.date; // e.g., "2025-12-01"

                    // Parse the time
                    const timeParts = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!timeParts) {
                        console.error('Invalid time format:', timeString);
                        this.isBooking = false;
                        return;
                    }

                    let hours = parseInt(timeParts[1]);
                    const minutes = parseInt(timeParts[2]);
                    const period = timeParts[3].toUpperCase();

                    // Convert to 24-hour format
                    if (period === 'PM' && hours !== 12) {
                        hours += 12;
                    } else if (period === 'AM' && hours === 12) {
                        hours = 0;
                    }

                    // Create ISO 8601 datetime string
                    const serviceStartTime = `${dateString}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

                    // Then update the service request start time
                    const requestData: ConfirmStartAtTimeDto = {
                        serviceId: this.serviceId,
                        clientId: this.clientId,
                        craftsManId: this.craftsmanId,
                        serviceStartTime: serviceStartTime
                    };

                    this.serviceRequestService.updateServiceRequestStartTime(this.serviceRequestId, requestData)
                        .subscribe({
                            next: (response: string) => {
                                console.log('Appointment confirmed successfully:', response);
                                this.isBooking = false;

                                // ✅ Backend automatically creates SelectCraftsman notification
                                // No need to manually create notification here

                                const isDark = this.themeService.isDark();
                                const textPrimary = isDark ? '#F0F0F0' : '#555';
                                const textSecondary = isDark ? '#B8B8B8' : '#666';
                                const infoBg = isDark ? 'rgba(253, 184, 19, 0.15)' : '#FEF3E2';

                                Swal.fire({
                                    ...getSwalThemeConfig(isDark),
                                    icon: 'success',
                                    title: 'Request Sent Successfully!',
                                    html: `
                                        <div style="text-align: center;">
                                            <p style="font-size: 16px; color: ${textPrimary}; margin-bottom: 15px;">
                                                Your appointment request has been sent to<br/>
                                                <strong style="color: #FDB813;">${this.craftsman?.fName} ${this.craftsman?.lName}</strong>
                                            </p>
                                            <p style="font-size: 15px; color: ${textSecondary};">
                                                📅 <strong>${this.selectedDay?.fullDayName}</strong><br/>
                                                🕐 <strong>${this.selectedTimeSlot?.time}</strong>
                                            </p>
                                            <div style="background: ${infoBg}; padding: 15px; border-radius: 8px; margin-top: 15px;">
                                                <p style="font-size: 14px; color: ${textSecondary}; margin: 0;">
                                                    Please wait for craftsman confirmation.<br/>
                                                    You will be notified once confirmed.
                                                </p>
                                            </div>
                                        </div>
                                    `,
                                    confirmButtonText: 'Got it!',
                                    showClass: {
                                        popup: 'animate__animated animate__fadeInDown'
                                    },
                                    hideClass: {
                                        popup: 'animate__animated animate__fadeOutUp'
                                    }
                                }).then(() => {
                                    this.router.navigate(['/']);
                                });
                            },
                            error: (error: any) => {
                                console.error('Error updating appointment time:', error);
                                this.isBooking = false;

                                Swal.fire({
                                    ...getSwalThemeConfig(this.themeService.isDark()),
                                    icon: 'error',
                                    title: 'Time Update Failed',
                                    text: error.error || 'Failed to set appointment time. Please try again.'
                                });
                            }
                        });
                },
                error: (error: any) => {
                    console.error('Error selecting craftsman:', error);
                    this.isBooking = false;

                    Swal.fire({
                        ...getSwalThemeConfig(this.themeService.isDark()),
                        icon: 'error',
                        title: 'Selection Failed',
                        text: error.error || 'Failed to select craftsman. Please try again.'
                    });
                }
            });
    }

    private loadCraftsmanReviews(): void {
        this.loadingReviews = true;
        this.reviewsError = null;

        // Load reviews
        this.reviewService.getReviewsForCraftsman(this.craftsmanId).subscribe({
            next: (reviews: ReviewResponse[]) => {
                console.log('Reviews loaded:', reviews);
                this.reviews = reviews;
                this.loadingReviews = false;
            },
            error: (error: any) => {
                console.error('Error loading reviews:', error);
                this.reviewsError = 'Failed to load reviews';
                this.loadingReviews = false;
            }
        });

        // Load average rating
        this.reviewService.getCraftsmanAverageRating(this.craftsmanId).subscribe({
            next: (response: any) => {
                console.log('Average rating response:', response);
                console.log('Response type:', typeof response);

                // Handle different response formats
                if (typeof response === 'number') {
                    // API returned just the rating number
                    this.averageRating = {
                        averageRating: response,
                        totalReviews: this.reviews.length,
                        craftsmanId: this.craftsmanId
                    };
                    console.log('✅ Created averageRating from number:', this.averageRating);
                } else if (response && typeof response === 'object') {
                    // API returned an object
                    this.averageRating = {
                        averageRating: response.averageRating || response.AverageRating || 0,
                        totalReviews: response.totalReviews || response.TotalReviews || this.reviews.length,
                        craftsmanId: response.craftsmanId || response.CraftsmanId || this.craftsmanId
                    };
                    console.log('✅ Created averageRating from object:', this.averageRating);
                } else {
                    console.warn('⚠️ Unexpected response format:', response);
                    this.averageRating = null;
                }
            },
            error: (error: any) => {
                console.error('Error loading average rating:', error);
                this.averageRating = null;
            }
        });
    }

    getStarsArray(rating: number): boolean[] {
        return Array.from({ length: 5 }, (_, i) => i < rating);
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    goBack(): void {
        this.router.navigate(['/craftsmen-list'], {
            queryParams: {
                location: this.location,
                serviceName: this.serviceName,
                serviceRequestId: this.serviceRequestId,
                serviceId: this.serviceId,
                duration: this.serviceDuration
            }
        });
    }
}
