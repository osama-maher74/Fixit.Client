import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { ClientService } from '../../services/client.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-my-requests',
    standalone: true,
    imports: [CommonModule, TranslateModule, FormsModule],
    templateUrl: './my-requests.component.html',
    styleUrl: './my-requests.component.css'
})
export class MyRequestsComponent implements OnInit {
    private router = inject(Router);
    private serviceRequestService = inject(ServiceRequestService);
    private clientService = inject(ClientService);
    private authService = inject(AuthService);
    private translate = inject(TranslateService);

    requests: ServiceRequestResponse[] = [];
    filteredRequests: ServiceRequestResponse[] = [];
    statuses: string[] = [];
    selectedStatus: string = 'All';

    loading = true;
    error: string | null = null;
    apiUrl = environment.apiUrl;

    // Enum mapping for parsing API strings
    statusEnumStr: { [key: string]: number } = {
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

    // ... (rest of methods)

    getStatusText(status: string | number | undefined): string {
        if (status === null || status === undefined) return this.translate.instant('MY_REQUESTS.UNKNOWN');
        const statusNum = typeof status === 'number' ? status : parseInt(status as any);

        const statusNames: { [key: number]: string } = {
            0: 'MY_REQUESTS.PENDING',
            1: 'MY_REQUESTS.WAITING_FOR_RESPONSE',
            2: 'MY_REQUESTS.WAITING_FOR_DECISION',
            3: 'MY_REQUESTS.WAITING_FOR_PAYMENT',
            4: 'MY_REQUESTS.REJECTED_BY_CRAFTSMAN',
            5: 'MY_REQUESTS.REJECTED_BY_CLIENT',
            6: 'MY_REQUESTS.IN_PROGRESS',
            7: 'MY_REQUESTS.COMPLETED',
            8: 'MY_REQUESTS.APPROVED',
            9: 'MY_REQUESTS.CANCELLED',
            10: 'MY_REQUESTS.CANCELLED_DUE_TO_NON_PAYMENT',
            11: 'MY_REQUESTS.CANCELLED_BY_CRAFTSMAN'
        };

        return this.translate.instant(statusNames[statusNum] || 'MY_REQUESTS.UNKNOWN');
    }

    ngOnInit() {
        this.loadStatuses();
        this.loadClientRequests();
    }

    getStatusDisplayName(statusName: string): string {
        const val = this.statusEnumStr[statusName];
        if (val !== undefined) {
            return this.getStatusText(val);
        }
        return statusName;
    }

    loadStatuses() {
        this.serviceRequestService.getServiceRequestStatuses().subscribe({
            next: (data) => {
                console.log('Statuses loaded:', data);
                this.statuses = data;
            },
            error: (err) => {
                console.error('Failed to load statuses:', err);
            }
        });
    }

    onStatusChange() {
        this.loadClientRequests();
    }

    loadClientRequests() {
        this.loading = true;
        this.error = null;

        // Get current client ID
        this.clientService.getCurrentUserProfile().subscribe({
            next: (client) => {
                console.log('Client profile loaded:', client);

                let requestObservable;

                if (this.selectedStatus && this.selectedStatus !== 'All') {
                    // Server-side filtering
                    console.log(`Fetching requests for client ${client.id} with status ${this.selectedStatus}`);
                    requestObservable = this.serviceRequestService.getRequestsByClientAndStatus(client.id, this.selectedStatus);
                } else {
                    // Fetch all
                    console.log(`Fetching all requests for client ${client.id}`);
                    requestObservable = this.serviceRequestService.getAllServiceRequestsForClientById(client.id);
                }

                requestObservable.subscribe({
                    next: (data) => {
                        console.log('Service requests loaded:', data);
                        this.requests = data;

                        if (this.selectedStatus && this.selectedStatus !== 'All') {
                            // If filtered from server, just show all
                            this.filteredRequests = this.requests;
                        } else {
                            // Default behavior: show all loaded requests
                            // (Previously filtered for active/history, but now user wants full control)
                            this.filteredRequests = this.requests;
                        }

                        this.loading = false;
                    },
                    error: (err) => {
                        console.error('Failed to load service requests:', err);
                        // If 404, it means no requests found. Treat as empty success.
                        if (err.status === 404) {
                            this.requests = [];
                            this.filteredRequests = [];
                            this.error = null;
                        } else {
                            // DEBUG: Show exact error to user for diagnosis
                            this.error = `Error loading requests: ${err.status} ${err.statusText}`;
                            // Revert to generic error after debugging if needed
                            // this.error = this.translate.instant('ERROR_DEFAULT');
                        }
                        this.loading = false;
                    }
                });
            },
            error: (err) => {
                console.error('Failed to load client profile:', err);
                this.error = this.translate.instant('ERROR_DEFAULT');
                this.loading = false;
            }
        });
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


}
