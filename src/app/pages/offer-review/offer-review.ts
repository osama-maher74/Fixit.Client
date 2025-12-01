import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { OfferService, ClientDecision } from '../../services/offer.service';
import { AuthService } from '../../services/auth.service';
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

    serviceRequest: ServiceRequestResponse | null = null;
    loading = true;
    error: string | null = null;
    apiUrl = environment.apiUrl;
    serviceRequestId: number = 0;
    offerId: number = 0;

    // Offer details from notification (passed via route state)
    offerAmount: number | null = null;
    offerDescription: string | null = null;
    offerCraftsmanName: string | null = null;

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
                this.loadServiceRequest(this.serviceRequestId);
            } else {
                this.error = 'Missing required parameters';
                this.loading = false;
            }
        });
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
            title: 'Accept Offer?',
            text: `Are you sure you want to accept this offer for ${amount.toFixed(2)} EGP?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
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
            title: 'Reject Offer?',
            text: 'Are you sure you want to reject this offer?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
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
                        icon: 'success',
                        title: 'Offer Accepted!',
                        text: 'Redirecting to payment page...',
                        confirmButtonColor: '#FDB813',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        this.router.navigate(['/payment', this.serviceRequestId]);
                    });
                } else {
                    // Client rejected the offer
                    Swal.fire({
                        icon: 'success',
                        title: 'Offer Declined',
                        text: 'You have declined the offer.',
                        confirmButtonColor: '#FDB813',
                        timer: 3000
                    }).then(() => {
                        this.router.navigate(['/']);
                    });
                }
            },
            error: (err) => {
                console.error('Failed to respond to offer:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Respond',
                    text: 'An error occurred. Please try again.',
                    confirmButtonColor: '#FDB813'
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
        // Show themed form modal
        Swal.fire({
            title: 'Submit New Offer',
            html: `
                <div style="text-align: left;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                            Final Amount (EGP)
                        </label>
                        <input
                            id="finalAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            class="swal2-input"
                            placeholder="Enter amount in EGP"
                            style="width: 100%; padding: 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 16px;"
                        />
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
                            Description
                        </label>
                        <textarea
                            id="description"
                            class="swal2-textarea"
                            placeholder="Describe your offer details..."
                            rows="4"
                            style="width: 100%; padding: 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 16px; resize: vertical;"
                        ></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Submit Offer',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#FDB813',
            cancelButtonColor: '#6B7280',
            focusConfirm: false,
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
                        icon: 'error',
                        title: 'Error',
                        text: 'Craftsman ID not found.',
                        confirmButtonColor: '#FDB813'
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
                            icon: 'success',
                            title: 'Offer Submitted!',
                            text: 'Your new offer has been sent to the client successfully.',
                            confirmButtonColor: '#FDB813',
                            timer: 3000
                        });
                    },
                    error: (err) => {
                        console.error('Failed to submit new offer:', err);
                        Swal.fire({
                            icon: 'error',
                            title: 'Submission Failed',
                            text: err.error?.message || 'Failed to submit your offer. Please try again.',
                            confirmButtonColor: '#FDB813'
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
