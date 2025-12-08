import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CraftsmanService } from '../../services/craftsman.service';
import { Craftsman } from '../../models/craftsman.models';

@Component({
    selector: 'app-craftsmen-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './craftsmen-list.html',
    styleUrl: './craftsmen-list.scss'
})
export class CraftsmenListComponent implements OnInit {
    craftsmen: Craftsman[] = [];
    isLoading = true;
    error: string | null = null;
    location: string = '';
    serviceName: string = '';
    serviceRequestId: number = 0;
    serviceId: number = 0;
    duration: number = 60;

    private craftsmanService = inject(CraftsmanService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.location = params['location'] || '';
            this.serviceName = params['serviceName'] || '';
            this.serviceRequestId = +params['serviceRequestId'] || 0;
            this.serviceId = +params['serviceId'] || 0;
            this.duration = +params['duration'] || 60;

            if (this.location && this.serviceName) {
                this.loadCraftsmen();
            } else {
                this.error = 'Missing location or service name';
                this.isLoading = false;
            }
        });
    }

    loadCraftsmen(): void {
        this.isLoading = true;
        this.error = null;

        this.craftsmanService.getCraftsmenByLocation(this.location, this.serviceName).subscribe({
            next: (craftsmen) => {
                // Format ratings to 1 decimal place
                this.craftsmen = craftsmen.map(c => ({
                    ...c,
                    rating: c.rating ? parseFloat(c.rating.toFixed(1)) : 0,
                    averageRating: c.averageRating ? parseFloat(c.averageRating.toFixed(1)) : 0
                }));
                this.isLoading = false;
                console.log('Craftsmen loaded:', this.craftsmen);
            },
            error: (error) => {
                console.error('Error loading craftsmen:', error);
                this.error = 'Failed to load craftsmen. Please try again later.';
                this.isLoading = false;
            }
        });
    }

    getFullName(craftsman: Craftsman): string {
        return `${craftsman.fName} ${craftsman.lName}`;
    }

    getStarsArray(rating: number): boolean[] {
        return Array(5).fill(false).map((_, index) => index < Math.round(rating));
    }

    getProfileImageUrl(profileImage: string): string {
        if (!profileImage) {
            return '/assets/images/default-avatar.png';
        }

        // If it's already a full URL, clean up double slashes and return
        if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
            const cleanedUrl = profileImage.replace(/([^:]\/)\/+/g, '$1');
            return cleanedUrl;
        }

        // Assuming the backend returns relative paths like '/images/ProfilePics/...'
        return `https://localhost:7058${profileImage}`;
    }

    selectCraftsman(craftsman: Craftsman): void {
        console.log('Selected craftsman:', craftsman);
        // Navigate to appointment scheduling with service request details
        this.router.navigate(['/appointment-scheduling'], {
            queryParams: {
                craftsmanId: craftsman.id,
                serviceRequestId: this.serviceRequestId,
                serviceId: this.serviceId,
                duration: this.duration,
                location: this.location,
                serviceName: this.serviceName
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/']);
    }
}
