import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { ReviewService, CreateReviewDTO, UpdateReviewDTO } from '../../services/review.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-request-details',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './request-details.component.html',
    styleUrl: './request-details.component.css'
})
export class RequestDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private serviceRequestService = inject(ServiceRequestService);
    private reviewService = inject(ReviewService);

    request: ServiceRequestResponse | null = null;
    loading = true;
    error: string | null = null;
    apiUrl = environment.apiUrl;
    completingRequest = false;

    // Review form properties
    reviewRating = 0;
    reviewComment = '';
    reviewId: number | null = null;
    submittingReview = false;

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadRequestDetails(+id);
            } else {
                this.error = 'Invalid request ID';
                this.loading = false;
            }
        });
    }

    loadRequestDetails(id: number) {
        this.loading = true;
        this.error = null;

        this.serviceRequestService.getServiceRequestById(id).subscribe({
            next: (data) => {
                console.log('Request details loaded:', data);
                this.request = data;
                this.loading = false;

                // Initialize review form if review exists
                this.initializeReviewForm();
            },
            error: (err) => {
                console.error('Failed to load request details:', err);
                this.error = 'Failed to load request details. Please try again.';
                this.loading = false;
            }
        });
    }

    initializeReviewForm() {
        if (this.request?.reviewRatingValue && this.request?.reviewComment) {
            this.reviewRating = this.request.reviewRatingValue;
            this.reviewComment = this.request.reviewComment;
            // Get review ID from the request data
            this.reviewId = this.request.reviewId || null;
        } else {
            this.reviewRating = 0;
            this.reviewComment = '';
            this.reviewId = null;
        }
    }

    hasExistingReview(): boolean {
        return !!(this.request?.reviewRatingValue || this.request?.reviewComment);
    }

    isCompleted(): boolean {
        if (!this.request?.status) return false;
        const statusNum = typeof this.request.status === 'number' ? this.request.status : parseInt(this.request.status as any);
        return statusNum === 7; // 7 = Completed
    }

    getImageUrl(): string {
        if (this.request?.imageUrl || this.request?.serviceRequestImage) {
            const imageUrl = this.request.imageUrl || this.request.serviceRequestImage;
            // Check if it's already a full URL
            if (imageUrl && imageUrl.startsWith('http')) {
                return imageUrl;
            }
            // Otherwise prepend the API base URL
            return `${this.apiUrl}${imageUrl}`;
        }
        // Fallback to a gray placeholder data URL
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateShort(dateString: string | undefined): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getStatusClass(status: string | number | undefined): string {
        if (status === null || status === undefined) return 'status-unknown';
        const statusNum = typeof status === 'number' ? status : parseInt(status as any);

        // Enum: 0=Pending, 1=WaitingForCraftsmanResponse, 2=WaitingForClientDecision,
        // 3=WaitingForClientPayment, 4=RejectedByCraftsman, 5=RejectedByClient,
        // 6=InProgress, 7=Completed, 8=Approved, 9=Cancelled, 10=CancelledDueToNonPayment
        switch (statusNum) {
            case 6: // InProgress
                return 'status-processing';
            case 7: // Completed
                return 'status-completed';
            case 0: // Pending
            case 1: // WaitingForCraftsmanResponse
            case 2: // WaitingForClientDecision
            case 3: // WaitingForClientPayment
                return 'status-pending';
            case 4: // RejectedByCraftsman
            case 5: // RejectedByClient
            case 9: // Cancelled
            case 10: // CancelledDueToNonPayment
                return 'status-cancelled';
            default:
                return 'status-unknown';
        }
    }

    getStatusIcon(status: string | number | undefined): string {
        if (status === null || status === undefined) return '❓';
        const statusNum = typeof status === 'number' ? status : parseInt(status as any);

        switch (statusNum) {
            case 6: // InProgress
                return '🔄';
            case 7: // Completed
                return '✅';
            case 0: // Pending
            case 1: // WaitingForCraftsmanResponse
            case 2: // WaitingForClientDecision
            case 3: // WaitingForClientPayment
                return '⏳';
            case 4: // RejectedByCraftsman
            case 5: // RejectedByClient
            case 9: // Cancelled
            case 10: // CancelledDueToNonPayment
                return '❌';
            default:
                return '❓';
        }
    }

    getStatusText(status: string | number | undefined): string {
        if (status === null || status === undefined) return 'Unknown';
        const statusNum = typeof status === 'number' ? status : parseInt(status as any);

        const statusNames: { [key: number]: string } = {
            0: 'Pending',
            1: 'Waiting for Response',
            2: 'Waiting for Decision',
            3: 'Waiting for Payment',
            4: 'Rejected',
            5: 'Rejected',
            6: 'In Progress',
            7: 'Completed',
            8: 'Approved',
            9: 'Cancelled',
            10: 'Cancelled'
        };

        return statusNames[statusNum] || 'Unknown';
    }

    isInProgress(): boolean {
        if (!this.request?.status) return false;
        const statusNum = typeof this.request.status === 'number' ? this.request.status : parseInt(this.request.status as any);
        return statusNum === 6; // 6 = InProgress
    }

    completeRequest() {
        if (!this.request || !this.isInProgress()) return;

        Swal.fire({
            title: 'Complete Service Request',
            html: `
                <p>Did the craftsman <strong>${this.request.craftsManName}</strong> arrive on time and complete the service?</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Complete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280'
        }).then((result) => {
            if (result.isConfirmed) {
                this.confirmCompletion();
            }
        });
    }

    private confirmCompletion() {
        if (!this.request) return;

        const requestId = this.request.servicesRequestId || this.request.id;
        if (!requestId) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Invalid request ID',
                confirmButtonColor: '#d4af37'
            });
            return;
        }

        this.completingRequest = true;

        // First complete the service request
        this.serviceRequestService.completeServiceRequest(requestId).subscribe({
            next: (response) => {
                console.log('Request completed successfully:', response);
                this.completingRequest = false;

                // After successful completion, show optional review form
                this.showReviewForm(requestId);
            },
            error: (err) => {
                console.error('Failed to complete request:', err);
                this.completingRequest = false;

                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Complete',
                    text: err.error?.message || 'Failed to complete the service request. Please try again.',
                    confirmButtonColor: '#d4af37'
                });
            }
        });
    }

    private showReviewForm(requestId: number) {
        if (!this.request) return;

        Swal.fire({
            title: `Rate ${this.request.craftsManName}`,
            html: `
                <p style="color: #6B7280; margin-bottom: 1.5rem;">Would you like to leave a review for this craftsman? (Optional)</p>
                <div style="text-align: left; padding: 1rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Rating (1-5 stars)
                        </label>
                        <div id="star-rating" style="display: flex; gap: 0.5rem; justify-content: center; font-size: 2.5rem; margin: 1rem 0;">
                            <span class="star-btn" data-rating="1" style="cursor: pointer; color: #E5E7EB; transition: all 0.2s;">★</span>
                            <span class="star-btn" data-rating="2" style="cursor: pointer; color: #E5E7EB; transition: all 0.2s;">★</span>
                            <span class="star-btn" data-rating="3" style="cursor: pointer; color: #E5E7EB; transition: all 0.2s;">★</span>
                            <span class="star-btn" data-rating="4" style="cursor: pointer; color: #E5E7EB; transition: all 0.2s;">★</span>
                            <span class="star-btn" data-rating="5" style="cursor: pointer; color: #E5E7EB; transition: all 0.2s;">★</span>
                        </div>
                        <input type="hidden" id="rating-value" value="0">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label for="review-comment" style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                            Comment
                        </label>
                        <textarea
                            id="review-comment"
                            class="swal2-textarea"
                            placeholder="Share your experience with this craftsman..."
                            style="width: 100%; min-height: 120px; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 8px; font-size: 1rem; font-family: inherit; resize: vertical;"
                        ></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Submit Review',
            denyButtonText: 'Skip Review',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d4af37',
            denyButtonColor: '#6b7280',
            cancelButtonColor: '#9ca3af',
            didOpen: () => {
                const stars = document.querySelectorAll('.star-btn');
                const ratingInput = document.getElementById('rating-value') as HTMLInputElement;

                stars.forEach((star, index) => {
                    star.addEventListener('click', () => {
                        const rating = index + 1;
                        ratingInput.value = rating.toString();

                        // Update star colors
                        stars.forEach((s, i) => {
                            if (i < rating) {
                                (s as HTMLElement).style.color = '#FDB813';
                            } else {
                                (s as HTMLElement).style.color = '#E5E7EB';
                            }
                        });
                    });

                    // Hover effect
                    star.addEventListener('mouseenter', () => {
                        const rating = index + 1;
                        stars.forEach((s, i) => {
                            if (i < rating) {
                                (s as HTMLElement).style.color = '#FDB813';
                                (s as HTMLElement).style.transform = 'scale(1.1)';
                            }
                        });
                    });

                    star.addEventListener('mouseleave', () => {
                        const currentRating = parseInt(ratingInput.value);
                        stars.forEach((s, i) => {
                            if (i < currentRating) {
                                (s as HTMLElement).style.color = '#FDB813';
                            } else {
                                (s as HTMLElement).style.color = '#E5E7EB';
                            }
                            (s as HTMLElement).style.transform = 'scale(1)';
                        });
                    });
                });
            },
            preConfirm: () => {
                const ratingInput = document.getElementById('rating-value') as HTMLInputElement;
                const commentTextarea = document.getElementById('review-comment') as HTMLTextAreaElement;

                const rating = parseInt(ratingInput.value);
                const comment = commentTextarea.value.trim();

                // Only validate if user is trying to submit a review
                if (!rating || rating < 1 || rating > 5) {
                    Swal.showValidationMessage('Please select a rating');
                    return false;
                }

                if (!comment) {
                    Swal.showValidationMessage('Please provide a comment');
                    return false;
                }

                return { rating, comment };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                // User chose to submit review
                this.submitReview(requestId, result.value.rating, result.value.comment);
            } else if (result.isDenied) {
                // User chose to skip review
                this.showCompletionSuccess(requestId);
            }
            // If cancelled, do nothing (user can still see the completed status)
        });
    }

    private submitReview(requestId: number, rating: number, comment: string) {
        if (!this.request) return;

        // Create review DTO
        const reviewDto: CreateReviewDTO = {
            ratingValue: rating,
            comment: comment,
            servicesRequestId: requestId
        };

        console.log('Submitting review:', reviewDto);

        // Submit review
        this.reviewService.createReview(reviewDto).subscribe({
            next: (reviewResponse) => {
                console.log('Review created successfully:', reviewResponse);

                Swal.fire({
                    icon: 'success',
                    title: 'Thank You!',
                    html: `
                        <p>Your review has been submitted successfully!</p>
                        <p style="margin-top: 1rem; color: #6B7280;">Rating: <span style="color: #FDB813; font-weight: 600;">${rating} ★</span></p>
                    `,
                    confirmButtonColor: '#d4af37'
                }).then(() => {
                    // Reload the request details to show updated status and review
                    this.loadRequestDetails(requestId);
                });
            },
            error: (err) => {
                console.error('Failed to submit review:', err);

                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Submit Review',
                    text: err.error?.message || 'Failed to submit your review. Please try again.',
                    confirmButtonColor: '#d4af37'
                }).then(() => {
                    // Still reload to show completed status even if review failed
                    this.loadRequestDetails(requestId);
                });
            }
        });
    }

    private showCompletionSuccess(requestId: number) {
        Swal.fire({
            icon: 'success',
            title: 'Request Completed!',
            text: 'The service request has been marked as complete.',
            confirmButtonColor: '#d4af37'
        }).then(() => {
            // Reload the request details to show updated status
            this.loadRequestDetails(requestId);
        });
    }

    setStarRating(rating: number) {
        this.reviewRating = rating;
    }

    submitReviewForm() {
        if (!this.request) return;

        // Validation
        if (this.reviewRating < 1 || this.reviewRating > 5) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Rating',
                text: 'Please select a rating between 1 and 5 stars.',
                confirmButtonColor: '#d4af37'
            });
            return;
        }

        if (!this.reviewComment.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Comment Required',
                text: 'Please provide a comment for your review.',
                confirmButtonColor: '#d4af37'
            });
            return;
        }

        this.submittingReview = true;
        const requestId = this.request.servicesRequestId || this.request.id;

        if (!requestId) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Invalid request ID',
                confirmButtonColor: '#d4af37'
            });
            this.submittingReview = false;
            return;
        }

        // Check if we're updating or creating
        if (this.hasExistingReview()) {
            // For updates, we need to fetch the review ID if we don't have it
            if (!this.reviewId) {
                // Fetch review ID from backend
                console.log('Fetching review ID for service request:', requestId);
                this.reviewService.getReviewByServiceRequest(requestId).subscribe({
                    next: (existingReview) => {
                        if (existingReview && existingReview.id) {
                            console.log('Found existing review with ID:', existingReview.id);
                            this.reviewId = existingReview.id;
                            // Now update the review
                            this.performReviewUpdate(requestId);
                        } else {
                            // No review found, create new one
                            console.log('No existing review found, creating new review');
                            this.performReviewCreate(requestId);
                        }
                    },
                    error: (err) => {
                        console.error('Failed to fetch existing review:', err);
                        // If fetch fails, assume we need to create
                        this.performReviewCreate(requestId);
                    }
                });
            } else {
                // We have review ID, perform update
                this.performReviewUpdate(requestId);
            }
        } else {
            // Create new review
            this.performReviewCreate(requestId);
        }
    }

    private performReviewUpdate(requestId: number) {
        if (!this.reviewId || !this.request) {
            this.submittingReview = false;
            return;
        }

        const updateDto: UpdateReviewDTO = {
            ratingValue: this.reviewRating,
            comment: this.reviewComment.trim()
        };

        console.log('Updating review with ID:', this.reviewId, 'DTO:', updateDto);

        this.reviewService.updateReview(this.reviewId, updateDto).subscribe({
            next: (response) => {
                console.log('Review updated successfully:', response);
                this.submittingReview = false;

                Swal.fire({
                    icon: 'success',
                    title: 'Review Updated!',
                    html: `
                        <p>Your review has been updated successfully!</p>
                        <p style="margin-top: 1rem; color: #6B7280;">Rating: <span style="color: #FDB813; font-weight: 600;">${this.reviewRating} ★</span></p>
                    `,
                    confirmButtonColor: '#d4af37'
                }).then(() => {
                    this.loadRequestDetails(requestId);
                });
            },
            error: (err) => {
                console.error('Failed to update review:', err);
                this.submittingReview = false;

                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Update Review',
                    text: err.error?.message || 'Failed to update your review. Please try again.',
                    confirmButtonColor: '#d4af37'
                });
            }
        });
    }

    private performReviewCreate(requestId: number) {
        if (!this.request) {
            this.submittingReview = false;
            return;
        }

        const createDto: CreateReviewDTO = {
            ratingValue: this.reviewRating,
            comment: this.reviewComment.trim(),
            servicesRequestId: requestId,
            clientId: this.request.clientId,
            craftsManId: this.request.craftsManId
        };

        console.log('Creating new review, DTO:', createDto);

        this.reviewService.createReview(createDto).subscribe({
            next: (response) => {
                console.log('Review created successfully:', response);
                this.submittingReview = false;
                this.reviewId = response.id; // Store the new review ID

                Swal.fire({
                    icon: 'success',
                    title: 'Review Submitted!',
                    html: `
                        <p>Your review has been submitted successfully!</p>
                        <p style="margin-top: 1rem; color: #6B7280;">Rating: <span style="color: #FDB813; font-weight: 600;">${this.reviewRating} ★</span></p>
                    `,
                    confirmButtonColor: '#d4af37'
                }).then(() => {
                    this.loadRequestDetails(requestId);
                });
            },
            error: (err) => {
                console.error('Failed to create review:', err);
                this.submittingReview = false;

                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Submit Review',
                    text: err.error?.message || 'Failed to submit your review. Please try again.',
                    confirmButtonColor: '#d4af37'
                });
            }
        });
    }

    goBack() {
        this.router.navigate(['/my-requests']);
    }
}
