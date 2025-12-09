import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { OfferService, ClientDecision, OfferResponse } from '../../services/offer.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { getSwalThemeConfig } from '../../helpers/swal-theme.helper';
import { environment } from '../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-offer-review',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './offer-review.html',
    styleUrl: './offer-review.css'
})
export class OfferReviewComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private serviceRequestService = inject(ServiceRequestService);
    private offerService = inject(OfferService);
    private authService = inject(AuthService);
    private themeService = inject(ThemeService);

    serviceRequest: ServiceRequestResponse | null = null;
    loading = true;
    error: string | null = null;
    apiUrl = environment.apiUrl;
    serviceRequestId: number = 0;
    offerId: number = 0;

    // Offer details from notification (passed via route state) or loaded from API
    offerAmount: number | null = null;
    offerDescription: string | null = null;
    offerCraftsmanName: string | null = null;
    offer: OfferResponse | null = null;

    ngOnInit() {
        // Get offer details from route state (passed from notification)
        // Use window.history.state instead of getCurrentNavigation() which only works during navigation
        const state = window.history.state;
        if (state) {
            this.offerAmount = state.offerAmount || null;
            this.offerDescription = state.offerDescription || null;
            this.offerCraftsmanName = state.craftsmanName || null;

            console.log('Offer details from route state:', {
                offerAmount: this.offerAmount,
                offerDescription: this.offerDescription,
                craftsmanName: this.offerCraftsmanName
            });
        }

        // Get IDs from route parameters
        this.route.paramMap.subscribe(params => {
            const srId = params.get('serviceRequestId');
            const offId = params.get('offerId');

            if (srId && offId) {
                this.serviceRequestId = +srId;
                this.offerId = +offId;
                this.loadData();
            } else {
                this.error = 'Missing required parameters';
                this.loading = false;
            }
        });
    }

    loadData() {
        this.loading = true;

        // Load both service request and offer details
        this.serviceRequestService.getServiceRequestById(this.serviceRequestId).subscribe({
            next: (data) => {
                console.log('Service request loaded:', data);
                this.serviceRequest = data;

                // Now load the offer details to get the finalAmount
                this.loadOfferDetails();
            },
            error: (err) => {
                console.error('Failed to load service request:', err);
                this.error = 'Failed to load service request details';
                this.loading = false;
            }
        });
    }

    loadOfferDetails() {
        // Get offer by ID
        if (this.offerId) {
            this.offerService.getOfferById(this.offerId).subscribe({
                next: (offerData) => {
                    console.log('Offer details loaded by ID:', offerData);
                    this.updateOfferData(offerData);
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Failed to load offer by ID:', err);
                    // Don't show error - just use what we have from state/service request
                    this.loading = false;
                }
            });
        } else {
            // No offer ID available
            console.warn('No offer ID available');
            this.loading = false;
        }
    }

    private updateOfferData(offerData: OfferResponse) {
        this.offer = offerData;
        console.log('Updating offer data:', offerData);

        // Update offer details from API response (overrides state if available)
        // Backend uses "amount" field for the offer price
        const offerPrice = offerData.amount || offerData.finalAmount;
        if (offerPrice) {
            this.offerAmount = offerPrice;
            console.log('Updated offerAmount to:', offerPrice);
        }
        if (offerData.description) {
            this.offerDescription = offerData.description;
            console.log('Updated offerDescription to:', offerData.description);
        }
        if (offerData.craftsManName) {
            this.offerCraftsmanName = offerData.craftsManName;
        }
    }

    loadServiceRequest(id: number) {
        this.loading = true;
        this.serviceRequestService.getServiceRequestById(id).subscribe({
            next: (data) => {
                console.log('Service request loaded:', data);
                this.serviceRequest = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load service request:', err);
                this.error = 'Failed to load service request details';
                this.loading = false;
            }
        });
    }

    onAccept() {
        const amount = this.offerAmount || this.serviceRequest?.totalAmount || 0;
        Swal.fire({
            ...getSwalThemeConfig(this.themeService.isDark()),
            title: 'Accept Offer?',
            text: `Are you sure you want to accept this offer for ${amount.toFixed(2)} EGP?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: this.themeService.isDark() ? '#555555' : '#6B7280',
            confirmButtonText: 'Yes, Accept',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.respondToOffer(ClientDecision.Accept);
            }
        });
    }

    onReject() {
        Swal.fire({
            ...getSwalThemeConfig(this.themeService.isDark()),
            title: 'Reject Offer?',
            text: 'Are you sure you want to reject this offer?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: this.themeService.isDark() ? '#555555' : '#6B7280',
            confirmButtonText: 'Yes, Reject',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.respondToOffer(ClientDecision.Reject);
            }
        });
    }

    respondToOffer(decision: ClientDecision) {
        this.offerService.clientRespond({ offerId: this.offerId, decision }).subscribe({
            next: () => {
                if (decision === ClientDecision.Accept) {
                    // Client accepted the offer - route to payment page
                    Swal.fire({
                        ...getSwalThemeConfig(this.themeService.isDark()),
                        icon: 'success',
                        title: 'Offer Accepted!',
                        text: 'Redirecting to payment page...',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        this.router.navigate(['/payment', this.serviceRequestId]);
                    });
                } else {
                    // Client rejected the offer
                    Swal.fire({
                        ...getSwalThemeConfig(this.themeService.isDark()),
                        icon: 'success',
                        title: 'Offer Declined',
                        text: 'You have declined the offer.',
                        timer: 3000
                    }).then(() => {
                        this.router.navigate(['/']);
                    });
                }
            },
            error: (err) => {
                console.error('Failed to respond to offer:', err);
                Swal.fire({
                    ...getSwalThemeConfig(this.themeService.isDark()),
                    icon: 'error',
                    title: 'Failed to Respond',
                    text: 'An error occurred. Please try again.'
                });
            }
        });
    }

    getImageUrl(): string {
        // Check for serviceRequestImage first (the image uploaded by the client)
        if (this.serviceRequest?.serviceRequestImage) {
            // Check if it's already a full URL
            if (this.serviceRequest.serviceRequestImage.startsWith('http')) {
                return this.serviceRequest.serviceRequestImage;
            }
            // Otherwise prepend the API base URL
            return `${this.apiUrl}${this.serviceRequest.serviceRequestImage}`;
        }

        // Fallback to imageUrl if serviceRequestImage is not available
        if (this.serviceRequest?.imageUrl) {
            // Check if it's already a full URL
            if (this.serviceRequest.imageUrl.startsWith('http')) {
                return this.serviceRequest.imageUrl;
            }
            // Otherwise prepend the API base URL
            return `${this.apiUrl}${this.serviceRequest.imageUrl}`;
        }

        // Return a default service-related image if no image is available
        return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    onNewOffer() {
        // Get theme colors
        const isDark = this.themeService.isDark();
        const labelColor = isDark ? '#F0F0F0' : '#374151';
        const inputBg = isDark ? '#333333' : '#FFFFFF';
        const inputBorder = isDark ? '#555555' : '#E5E7EB';
        const inputText = isDark ? '#F0F0F0' : '#1F2937';
        const placeholderColor = isDark ? '#808080' : '#9CA3AF';

        // Show themed form modal
        Swal.fire({
            ...getSwalThemeConfig(isDark),
            title: 'Submit New Offer',
            html: `
                <div style="text-align: left;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: ${labelColor};">
                            Final Amount (EGP)
                        </label>
                        <input
                            id="finalAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            class="swal2-input"
                            placeholder="Enter amount in EGP"
                            style="width: 100%; padding: 12px; border: 1.5px solid ${inputBorder}; border-radius: 8px; font-size: 16px; background-color: ${inputBg}; color: ${inputText};"
                        />
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: ${labelColor};">
                            Description
                        </label>
                        <textarea
                            id="description"
                            class="swal2-textarea"
                            placeholder="Describe your offer details..."
                            rows="4"
                            style="width: 100%; padding: 12px; border: 1.5px solid ${inputBorder}; border-radius: 8px; font-size: 16px; resize: vertical; background-color: ${inputBg}; color: ${inputText};"
                        ></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Submit Offer',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#FDB813',
            cancelButtonColor: isDark ? '#555555' : '#6B7280',
            focusConfirm: false,
            didOpen: () => {
                // Apply placeholder color styling
                const style = document.createElement('style');
                style.textContent = `
                    #finalAmount::placeholder,
                    #description::placeholder {
                        color: ${placeholderColor};
                    }
                `;
                document.head.appendChild(style);
            },
            preConfirm: () => {
                const finalAmountInput = document.getElementById('finalAmount') as HTMLInputElement;
                const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;

                const finalAmount = parseFloat(finalAmountInput.value);
                const description = descriptionInput.value.trim();

                if (!finalAmountInput.value || isNaN(finalAmount) || finalAmount <= 0) {
                    Swal.showValidationMessage('Please enter a valid amount greater than 0');
                    return false;
                }

                if (!description) {
                    Swal.showValidationMessage('Please provide a description for your offer');
                    return false;
                }

                return { finalAmount, description };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                // Get craftsman ID from current user
                const userId = this.authService.getCurrentUser()?.id;
                const craftsmanId = userId ? parseInt(userId, 10) : 0;

                if (!craftsmanId) {
                    Swal.fire({
                        ...getSwalThemeConfig(this.themeService.isDark()),
                        icon: 'error',
                        title: 'Error',
                        text: 'Craftsman ID not found.'
                    });
                    return;
                }

                const newOfferData = {
                    serviceRequestId: this.serviceRequestId,
                    craftsmanId: craftsmanId,
                    finalAmount: result.value.finalAmount,
                    description: result.value.description
                };

                console.log('Submitting new offer:', newOfferData);

                this.offerService.craftsmanNewOffer(newOfferData).subscribe({
                    next: () => {
                        console.log('New offer submitted successfully');
                        Swal.fire({
                            ...getSwalThemeConfig(this.themeService.isDark()),
                            icon: 'success',
                            title: 'Offer Submitted!',
                            text: 'Your new offer has been sent to the client successfully.',
                            timer: 3000
                        });
                    },
                    error: (err) => {
                        console.error('Failed to submit new offer:', err);
                        Swal.fire({
                            ...getSwalThemeConfig(this.themeService.isDark()),
                            icon: 'error',
                            title: 'Submission Failed',
                            text: err.error?.message || 'Failed to submit your offer. Please try again.'
                        });
                    }
                });
            }
        });
    }

    get isCraftsman(): boolean {
        const user = this.authService.getCurrentUser();
        return user?.role?.toLowerCase() === 'craftsman';
    }

    /**
     * Determine if action buttons should be shown
     * Hide buttons when service request status is in a final or non-actionable state
     */
    shouldShowActionButtons(): boolean {
        if (!this.serviceRequest) return false;

        const statusName = this.getStatusEnumName(this.serviceRequest.status);

        // Hide buttons for these statuses
        const hiddenStatuses = [
            'InProgress',
            'Completed',
            'WaitingForClientPayment',
            'CancelledDueToNonPayment',
            'Cancelled',
            'RejectedByCraftsman',
            'RejectedByClient'
        ];

        return !hiddenStatuses.includes(statusName);
    }

    /**
     * Map numeric status values to enum names
     */
    private getStatusEnumName(status: any): string {
        // Handle null/undefined
        if (status === null || status === undefined) return 'Pending';

        // If it's already a string, return it
        if (typeof status === 'string') return status;

        // Map numeric values to enum names based on C# enum
        const statusMap: { [key: number]: string } = {
            0: 'Pending',
            1: 'WaitingForCraftsmanResponse',
            2: 'WaitingForClientDecision',
            3: 'WaitingForClientPayment',
            4: 'RejectedByCraftsman',
            5: 'RejectedByClient',
            6: 'InProgress',
            7: 'Completed',
            8: 'Approved',
            9: 'Cancelled',
            10: 'CancelledDueToNonPayment'
        };

        const numericStatus = Number(status);
        return statusMap[numericStatus] || 'Pending';
    }

    getStatusClass(status: any): string {
        const statusName = this.getStatusEnumName(status);
        const statusStr = statusName.toLowerCase();

        // Map backend status to CSS classes
        if (statusStr.includes('waiting')) return 'waiting';
        if (statusStr.includes('reject')) return 'rejected';
        if (statusStr.includes('approved') || statusStr.includes('completed')) return 'approved';
        if (statusStr.includes('inprogress')) return 'inprogress';
        if (statusStr.includes('cancel')) return 'cancelled';
        if (statusStr === 'pending') return 'pending';

        return 'pending';
    }

    /**
     * Get translation key for status
     */
    formatStatus(status: any): string {
        const statusName = this.getStatusEnumName(status);

        // Convert to uppercase snake_case for translation key
        // e.g., "WaitingForCraftsmanResponse" -> "WAITING_FOR_CRAFTSMAN_RESPONSE"
        const translationKey = statusName
            .replace(/([A-Z])/g, '_$1')
            .toUpperCase()
            .replace(/^_/, '');

        return `OFFER_REVIEW.STATUS_VALUES.${translationKey}`;
    }

    goBack() {
        this.router.navigate(['/']);
    }
}
