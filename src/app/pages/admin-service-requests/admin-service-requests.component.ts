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
    statuses = signal<string[]>([]);
    loading = signal<boolean>(true);
    error = signal<string | null>(null);
    apiUrl = environment.apiUrl;

    // Enum mapping for filtering
    statusEnum: { [key: string]: number } = {
        'Pending': 0,
        'WaitingForCraftsmanResponse': 1,
        'WaitingForClientDecision': 2,
        'WaitingForClientPayment': 3,
        'RejectedByCraftsman': 4,
        'RejectedByClient': 5,
        'InProgress': 6,
        'Completed': 7,
        'Approved': 8,
        'Cancelled': 9,
        'CancelledDueToNonPayment': 10,
        'CancelledByCraftsman': 11
    };

    // Filter options
    statusFilter = signal<string>('all');
    searchQuery = signal<string>('');

    ngOnInit() {
        this.loadStatuses();
        this.loadAllRequests();
    }

    loadStatuses() {
        this.serviceRequestService.getServiceRequestStatuses().subscribe({
            next: (data) => {
                this.statuses.set(data);
            },
            error: (err) => console.error('Failed to load statuses', err)
        });
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
                // If 404, it means no requests found. Treat as empty success.
                if (err.status === 404) {
                    this.requests.set([]);
                    this.applyFilters(); // Updates filteredRequests
                    this.error.set(null);
                } else {
                    this.error.set(this.translate.instant('ADMIN_REQUESTS.ERROR_LOADING'));
                }
                this.loading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = [...this.requests()];

        // Apply status filter
        // Apply status filter
        if (this.statusFilter() !== 'all') {
            const selectedStatusName = this.statusFilter();
            // Map the selected string name to the number
            const targetStatusNum = this.statusEnum[selectedStatusName];

            if (targetStatusNum !== undefined) {
                filtered = filtered.filter(req => {
                    const status = typeof req.status === 'number' ? req.status : parseInt(req.status as any);
                    return status === targetStatusNum;
                });
            }
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
        if (status === null || status === undefined) return this.translate.instant('ADMIN_REQUESTS.STATUS_UNKNOWN');

        // If status is a string (e.g. from dropdown), try to map it to number first
        let statusNum: number;
        if (typeof status === 'string') {
            if (!isNaN(parseInt(status))) {
                statusNum = parseInt(status);
            } else {
                // Try mapping from name
                const mapped = this.statusEnum[status];
                statusNum = mapped !== undefined ? mapped : -1;
            }
        } else {
            statusNum = status;
        }

        const statusKeys: { [key: number]: string } = {
            0: 'ADMIN_REQUESTS.STATUS_PENDING',
            1: 'ADMIN_REQUESTS.STATUS_WAITING_CRAFTSMAN',
            2: 'ADMIN_REQUESTS.STATUS_WAITING_CLIENT',
            3: 'ADMIN_REQUESTS.STATUS_WAITING_PAYMENT',
            4: 'ADMIN_REQUESTS.STATUS_REJECTED_CRAFTSMAN',
            5: 'ADMIN_REQUESTS.STATUS_REJECTED_CLIENT',
            6: 'ADMIN_REQUESTS.STATUS_IN_PROGRESS',
            7: 'ADMIN_REQUESTS.STATUS_COMPLETED',
            8: 'ADMIN_REQUESTS.STATUS_APPROVED',
            9: 'ADMIN_REQUESTS.STATUS_CANCELLED',
            10: 'ADMIN_REQUESTS.STATUS_CANCELLED_PAYMENT'
        };

        const key = statusKeys[statusNum];
        return key ? this.translate.instant(key) : this.translate.instant('ADMIN_REQUESTS.STATUS_UNKNOWN');
    }
}
