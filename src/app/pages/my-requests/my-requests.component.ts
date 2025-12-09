import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { ClientService } from '../../services/client.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-my-requests',
    standalone: true,
    imports: [CommonModule, TranslateModule],
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
    loading = true;
    error: string | null = null;
    apiUrl = environment.apiUrl;

    ngOnInit() {
        this.loadClientRequests();
    }

    loadClientRequests() {
        this.loading = true;
        this.error = null;

        // Get current client ID
        this.clientService.getCurrentUserProfile().subscribe({
            next: (client) => {
                console.log('Client profile loaded:', client);
                this.serviceRequestService.getAllServiceRequestsForClientById(client.id).subscribe({
                    next: (data) => {
                        console.log('Service requests loaded:', data);
                        this.requests = data;
                        // Filter to show Processing (InProgress=6), Completed (7), and Cancelled (9, 10) requests
                        // Status comes as enum number from backend
                        this.filteredRequests = this.requests.filter(req => {
                            const status = typeof req.status === 'number' ? req.status : parseInt(req.status as any);
                            return status === 6 || status === 7 || status === 9 || status === 10; // 6 = InProgress, 7 = Completed, 9 = Cancelled, 10 = CancelledDueToNonPayment
                        });
                        this.loading = false;
                    },
                    error: (err) => {
                        console.error('Failed to load service requests:', err);
                        this.error = this.translate.instant('ERROR_DEFAULT');
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
        if (status === null || status === undefined) return this.translate.instant('MY_REQUESTS.UNKNOWN');
        const statusNum = typeof status === 'number' ? status : parseInt(status as any);

        const statusKeys: { [key: number]: string } = {
            0: 'MY_REQUESTS.PENDING',
            1: 'MY_REQUESTS.WAITING_FOR_RESPONSE',
            2: 'MY_REQUESTS.WAITING_FOR_DECISION',
            3: 'MY_REQUESTS.WAITING_FOR_PAYMENT',
            4: 'MY_REQUESTS.REJECTED',
            5: 'MY_REQUESTS.REJECTED',
            6: 'MY_REQUESTS.IN_PROGRESS',
            7: 'MY_REQUESTS.COMPLETED',
            8: 'MY_REQUESTS.APPROVED',
            9: 'MY_REQUESTS.CANCELLED',
            10: 'MY_REQUESTS.CANCELLED'
        };

        return this.translate.instant(statusKeys[statusNum] || 'MY_REQUESTS.UNKNOWN');
    }
}
