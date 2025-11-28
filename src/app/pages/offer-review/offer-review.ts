import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { OfferService, ClientDecision } from '../../services/offer.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-offer-review',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './offer-review.html',
    styleUrl: './offer-review.css'
})
export class OfferReviewComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private serviceRequestService = inject(ServiceRequestService);
    private offerService = inject(OfferService);

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
                const message = decision === ClientDecision.Accept
                    ? 'You have accepted the offer!'
                    : 'You have declined the offer.';

                Swal.fire({
                    icon: 'success',
                    title: 'Response Sent',
                    text: message,
                    confirmButtonColor: '#FDB813',
                    timer: 3000
                }).then(() => {
                    this.router.navigate(['/']);
                });
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
        if (this.serviceRequest?.imageUrl || this.serviceRequest?.serviceRequestImage) {
            const imageUrl = this.serviceRequest.imageUrl || this.serviceRequest.serviceRequestImage;
            // Check if it's already a full URL
            if (imageUrl && imageUrl.startsWith('http')) {
                return imageUrl;
            }
            // Otherwise prepend the API base URL
            return `${this.apiUrl}${imageUrl}`;
        }
        return 'assets/offer-placeholder.png'; // Fallback image
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

    goBack() {
        this.router.navigate(['/']);
    }
}
