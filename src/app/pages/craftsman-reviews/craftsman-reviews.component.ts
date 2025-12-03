import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReviewService, ReviewResponse, AverageRatingResponse } from '../../services/review.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-craftsman-reviews',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './craftsman-reviews.component.html',
    styleUrl: './craftsman-reviews.component.css'
})
export class CraftsmanReviewsComponent implements OnInit {
    private router = inject(Router);
    private reviewService = inject(ReviewService);
    private craftsmanService = inject(CraftsmanService);
    private authService = inject(AuthService);
    private translate = inject(TranslateService);

    reviews: ReviewResponse[] = [];
    averageRating: AverageRatingResponse | null = null;
    loading = true;
    error: string | null = null;
    craftsmanId: number | null = null;

    // Expose Math to template
    Math = Math;

    ngOnInit() {
        this.loadReviews();
    }

    loadReviews() {
        this.loading = true;
        this.error = null;

        // Get current craftsman ID
        this.craftsmanService.getCurrentUserProfile().subscribe({
            next: (craftsman) => {
                console.log('Craftsman profile loaded:', craftsman);
                this.craftsmanId = craftsman.id;

                // Load reviews and average rating in parallel
                this.reviewService.getReviewsForCraftsman(craftsman.id).subscribe({
                    next: (reviews) => {
                        console.log('Reviews loaded:', reviews);
                        this.reviews = reviews;
                        this.loading = false;
                    },
                    error: (err) => {
                        console.error('Failed to load reviews:', err);
                        this.error = this.translate.instant('MY_REVIEWS.ERROR_LOAD');
                        this.loading = false;
                    }
                });

                // Load average rating
                this.reviewService.getCraftsmanAverageRating(craftsman.id).subscribe({
                    next: (avgRating) => {
                        console.log('Average rating loaded:', avgRating);
                        this.averageRating = avgRating;
                    },
                    error: (err) => {
                        console.error('Failed to load average rating:', err);
                    }
                });
            },
            error: (err) => {
                console.error('Failed to load craftsman profile:', err);
                this.error = this.translate.instant('MY_REVIEWS.ERROR_PROFILE');
                this.loading = false;
            }
        });
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getStarsArray(rating: number): boolean[] {
        return Array.from({ length: 5 }, (_, i) => i < rating);
    }

    goBack() {
        this.router.navigate(['/profile']);
    }
}
