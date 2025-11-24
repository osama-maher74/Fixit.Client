import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CraftsmanService } from '../../services/craftsman.service';
import { CraftsmanProfile } from '../../models/craftsman.models';

@Component({
    selector: 'app-craftsmen-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './craftsmen-list.html',
    styleUrls: ['./craftsmen-list.scss']
})
export class CraftsmenListComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private craftsmanService = inject(CraftsmanService);

    craftsmen: CraftsmanProfile[] = [];
    isLoading = true;
    error: string | null = null;

    location: string = '';
    serviceName: string = '';

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.location = params['location'] || '';
            this.serviceName = params['serviceName'] || '';

            if (this.location && this.serviceName) {
                this.fetchCraftsmen();
            } else {
                this.isLoading = false;
                this.error = 'Missing location or service information.';
            }
        });
    }

    fetchCraftsmen(): void {
        this.isLoading = true;
        this.error = null;

        this.craftsmanService.getCraftsmenByLocationAndService(this.location, this.serviceName)
            .subscribe({
                next: (data) => {
                    this.craftsmen = data;
                    this.isLoading = false;
                    console.log('Craftsmen fetched:', this.craftsmen);
                },
                error: (err) => {
                    console.error('Error fetching craftsmen:', err);
                    this.error = 'Failed to load craftsmen. Please try again later.';
                    this.isLoading = false;
                }
            });
    }

    getStarArray(rating: number): number[] {
        return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
    }

    goBack(): void {
        this.router.navigate(['/']);
    }
}
