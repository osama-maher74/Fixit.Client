import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateReviewDTO {
    ratingValue: number;
    comment: string;
    servicesRequestId: number;
}

export interface ReviewResponse {
    id: number;
    ratingValue: number;
    comment: string;
    servicesRequestId: number;
    createdAt: string;
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
}
