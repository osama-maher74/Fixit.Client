import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComplaintsService, ComplaintDTO } from '../../services/complaints.service';
import { AuthService } from '../../services/auth.service';
import { ServiceRequestService } from '../../services/service-request.service';

@Component({
    selector: 'app-complaints-list',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './complaints-list.html',
    styleUrl: './complaints-list.css'
})
export class ComplaintsList implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private translate = inject(TranslateService);
    private complaintsService = inject(ComplaintsService);
    private authService = inject(AuthService);
    private serviceRequestService = inject(ServiceRequestService);

    complaints: ComplaintDTO[] = [];
    loading = true;
    error: string | null = null;
    serviceRequestId: number = 0;

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.serviceRequestId = +id;
                this.loadComplaints(this.serviceRequestId);
            } else {
                this.error = 'Invalid Request ID';
                this.loading = false;
            }
        });
    }

    isCraftsman(): boolean {
        const user = this.authService.getCurrentUser();
        return user?.role?.toLowerCase() === 'craftsman';
    }

    loadComplaints(requestId: number) {
        this.loading = true;

        this.serviceRequestService.getServiceRequestById(requestId).subscribe({
            next: (request) => {
                const userId = this.isCraftsman()
                    ? (request.craftsManId || 0)
                    : (request.clientId || 0);

                if (!userId) {
                    this.error = 'User ID not found in request details';
                    this.loading = false;
                    return;
                }

                this.complaintsService.getComplaintsByServiceRequest(requestId, userId, this.isCraftsman())
                    .subscribe({
                        next: (data) => {
                            this.complaints = (data || []).sort((a, b) =>
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                            );
                            this.loading = false;
                        },
                        error: (err) => {
                            console.error('Failed to load complaints:', err);
                            this.error = this.translate.instant('ERROR_DEFAULT');
                            this.loading = false;
                        }
                    });
            },
            error: (err) => {
                console.error('Failed to load request details:', err);
                this.error = this.translate.instant('ERROR_DEFAULT');
                this.loading = false;
            }
        });
    }

    formatDateShort(dateString: string | undefined): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    goBack() {
        this.router.navigate(['/request-details', this.serviceRequestId]);
    }
}
