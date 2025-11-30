import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateReviewDTO {
    ratingValue: number;
    comment: string;
    servicesRequestId: number;
    clientId?: number;
    craftsManId?: number;
}

export interface UpdateReviewDTO {
    ratingValue: number;
    comment: string;
}

export interface ReviewResponse {
    id: number;
    ratingValue: number;
    comment: string;
    reviewDate: string; // Required - provided by backend as ReviewDate
    clientId: number; // Required - provided by backend as ClientId
    clientName?: string; // Optional - not provided by backend GetAllReviewsDTO
    craftsManId: number; // Required - provided by backend as CraftsManId
    servicesRequestId: number;
    createdAt?: string; // Optional - may be used in other contexts
}

export interface AverageRatingResponse {
    averageRating: number;
    totalReviews: number;
    craftsmanId: number;
}

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private http = inject(HttpClient);
    private API_URL = `${environment.apiUrl}/Review`;

    /**
     * Create a new review for a service request
     * POST /api/Review
     */
    createReview(reviewDto: CreateReviewDTO): Observable<ReviewResponse> {
        return this.http.post<ReviewResponse>(this.API_URL, reviewDto);
    }

    /**
     * Update an existing review
     * PUT /api/Review/{id}
     */
    updateReview(reviewId: number, reviewDto: UpdateReviewDTO): Observable<ReviewResponse> {
        return this.http.put<ReviewResponse>(`${this.API_URL}/${reviewId}`, reviewDto);
    }

    /**
     * Get review by service request ID
     * GET /api/Review/ServiceRequest/{serviceRequestId}
     */
    getReviewByServiceRequest(serviceRequestId: number): Observable<ReviewResponse | null> {
        return this.http.get<ReviewResponse | null>(`${this.API_URL}/ServiceRequest/${serviceRequestId}`);
    }

    /**
     * Get craftsman average rating and review count
     * GET /api/Review/craftsman/{craftsmanId}/average-rating
     */
    getCraftsmanAverageRating(craftsmanId: number): Observable<AverageRatingResponse> {
        return this.http.get<AverageRatingResponse>(`${this.API_URL}/craftsman/${craftsmanId}/average-rating`);
    }

    /**
     * Get all reviews for a craftsman
     * GET /api/Review/craftsman/{craftsmanId}
     */
    getReviewsForCraftsman(craftsmanId: number): Observable<ReviewResponse[]> {
        return this.http.get<ReviewResponse[]>(`${this.API_URL}/craftsman/${craftsmanId}`);
    }
}
