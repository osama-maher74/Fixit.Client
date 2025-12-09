import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-admin-service-requests',
    standalone: true,
    imports: [CommonModule, TranslateModule, FormsModule],
    templateUrl: './admin-service-requests.component.html',
    styleUrl: './admin-service-requests.component.css'
})
export class AdminServiceRequestsComponent implements OnInit {
    private router = inject(Router);
    private serviceRequestService = inject(ServiceRequestService);
    private translate = inject(TranslateService);

    requests = signal<ServiceRequestResponse[]>([]);
    filteredRequests = signal<ServiceRequestResponse[]>([]);
    loading = signal<boolean>(true);
    error = signal<string | null>(null);
    apiUrl = environment.apiUrl;

    // Filter options
    statusFilter = signal<string>('all');
    searchQuery = signal<string>('');

    ngOnInit() {
        this.loadAllRequests();
    }

    loadAllRequests() {
        this.loading.set(true);
        this.error.set(null);

        this.serviceRequestService.getAllServiceRequests().subscribe({
            next: (data) => {
                console.log('All service requests loaded:', data);
                this.requests.set(data);
                this.applyFilters();
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load service requests:', err);
                this.error.set(this.translate.instant('ADMIN_REQUESTS.ERROR_LOADING'));
                this.loading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = [...this.requests()];

        // Apply status filter
        if (this.statusFilter() !== 'all') {
            const statusNum = parseInt(this.statusFilter());
            filtered = filtered.filter(req => {
                const status = typeof req.status === 'number' ? req.status : parseInt(req.status as any);
                return status === statusNum;
            });
        }

        // Apply search filter
        const query = this.searchQuery().toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(req =>
                (req.clientName?.toLowerCase().includes(query)) ||
                (req.craftsManName?.toLowerCase().includes(query)) ||
                (req.serviceName?.toLowerCase().includes(query)) ||
                (req.location?.toLowerCase().includes(query)) ||
                (req.servicesRequestId?.toString().includes(query))
            );
        }

        this.filteredRequests.set(filtered);
    }

    onStatusFilterChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.statusFilter.set(select.value);
        this.applyFilters();
    }

    onSearchChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
        this.applyFilters();
    }

    viewRequestDetails(request: ServiceRequestResponse) {
        const requestId = request.servicesRequestId || request.id;
        if (requestId) {
            this.router.navigate(['/request-details', requestId]);
        }
    }

    getImageUrl(request: ServiceRequestResponse): string {
        if (request.imageUrl || request.serviceRequestImage) {
            const imageUrl = request.imageUrl || request.serviceRequestImage;
            if (imageUrl && imageUrl.startsWith('http')) {
                return imageUrl;
            }
            return `${this.apiUrl}${imageUrl}`;
        }
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusClass(status: string | number | undefined): string {
        if (status === null || status === undefined) return 'status-unknown';
        const statusNum = typeof status === 'number' ? status : parseInt(status as any);

        switch (statusNum) {
            case 6: return 'status-in-progress';
            case 7: return 'status-completed';
            case 0:
            case 1:
            case 2:
            case 3: return 'status-pending';
            case 4:
            case 5:
            case 9:
            case 10: return 'status-cancelled';
            case 8: return 'status-approved';
            default: return 'status-unknown';
        }
    }

    getStatusText(status: string | number | undefined): string {
        if (status === null || status === undefined) return 'Unknown';
        const statusNum = typeof status === 'number' ? status : parseInt(status as any);

        const statusTexts: { [key: number]: string } = {
            0: 'Pending',
            1: 'Waiting for Craftsman',
            2: 'Waiting for Client',
            3: 'Waiting for Payment',
            4: 'Rejected by Craftsman',
            5: 'Rejected by Client',
            6: 'In Progress',
            7: 'Completed',
            8: 'Approved',
            9: 'Cancelled',
            10: 'Cancelled (No Payment)'
        };

        return statusTexts[statusNum] || 'Unknown';
    }
}
