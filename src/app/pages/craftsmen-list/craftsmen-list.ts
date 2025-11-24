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

    private craftsmanService = inject(CraftsmanService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.location = params['location'] || '';
            this.serviceName = params['serviceName'] || '';

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
                this.craftsmen = craftsmen;
                this.isLoading = false;
                console.log('Craftsmen loaded:', craftsmen);
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
        // Assuming the backend returns relative paths like '/images/ProfilePics/...'
        return `https://localhost:7058${profileImage}`;
    }

    selectCraftsman(craftsman: Craftsman): void {
        console.log('Selected craftsman:', craftsman);
        // TODO: Navigate to craftsman profile or booking confirmation
        alert(`Selected ${this.getFullName(craftsman)}`);
    }

    goBack(): void {
        this.router.navigate(['/']);
    }
}
