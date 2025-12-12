import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComplaintsService, ComplaintDTO } from '../../services/complaints.service';

@Component({
    selector: 'app-admin-complaints',
    standalone: true,
    imports: [CommonModule, TranslateModule, FormsModule],
    templateUrl: './admin-complaints.html',
    styleUrl: './admin-complaints.css'
})
export class AdminComplaints implements OnInit {
    private router = inject(Router);
    private complaintsService = inject(ComplaintsService);
    private translate = inject(TranslateService);

    complaints = signal<ComplaintDTO[]>([]);
    filteredComplaints = signal<ComplaintDTO[]>([]);
    loading = signal<boolean>(true);
    error = signal<string | null>(null);

    // Filter options
    statusFilter = signal<string>('all');
    searchQuery = signal<string>('');

    // Response modal state
    showResponseModal = signal<boolean>(false);
    selectedComplaint = signal<ComplaintDTO | null>(null);
    adminResponse = signal<string>('');
    isSubmitting = signal<boolean>(false);

    ngOnInit() {
        this.loadAllComplaints();
    }

    loadAllComplaints() {
        this.loading.set(true);
        this.error.set(null);

        this.complaintsService.getAllComplaints().subscribe({
            next: (data) => {
                console.log('All complaints loaded:', data);
                // Sort by creation date, most recent first
                const sorted = data.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                this.complaints.set(sorted);
                this.applyFilters();
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load complaints:', err);
                this.error.set(this.translate.instant('ADMIN_COMPLAINTS.ERROR_LOADING'));
                this.loading.set(false);
            }
        });
    }

    applyFilters() {
        let filtered = [...this.complaints()];

        // Apply status filter
        if (this.statusFilter() !== 'all') {
            filtered = filtered.filter(complaint =>
                complaint.status.toLowerCase() === this.statusFilter().toLowerCase()
            );
        }

        // Apply search filter
        const query = this.searchQuery().toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(complaint =>
                (complaint.content?.toLowerCase().includes(query)) ||
                (complaint.adminResponse?.toLowerCase().includes(query)) ||
                (complaint.serviceRequestId?.toString().includes(query)) ||
                (complaint.id?.toString().includes(query))
            );
        }

        this.filteredComplaints.set(filtered);
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

    viewComplaintDetails(complaint: ComplaintDTO) {
        // Navigate to the service request details page
        this.router.navigate(['/request-details', complaint.serviceRequestId]);
    }

    openResponseModal(complaint: ComplaintDTO) {
        this.selectedComplaint.set(complaint);
        this.adminResponse.set(complaint.adminResponse || '');
        this.showResponseModal.set(true);
    }

    closeResponseModal() {
        this.showResponseModal.set(false);
        this.selectedComplaint.set(null);
        this.adminResponse.set('');
        this.isSubmitting.set(false);
    }

    submitResponse() {
        const complaint = this.selectedComplaint();
        const response = this.adminResponse().trim();

        if (!complaint || !response) {
            return;
        }

        this.isSubmitting.set(true);

        const payload: any = {
            complaintId: complaint.id,
            adminResponse: response,
            status: 'InProgress'
        };

        this.complaintsService.respondToComplaint(payload).subscribe({
            next: () => {
                // Update the complaint in the list
                const updatedComplaints = this.complaints().map(c =>
                    c.id === complaint.id
                        ? { ...c, adminResponse: response, status: 'InProgress' }
                        : c
                );
                this.complaints.set(updatedComplaints);
                this.applyFilters();
                this.closeResponseModal();
            },
            error: (err) => {
                console.error('Failed to submit response:', err);
                this.isSubmitting.set(false);
                alert('Failed to submit response. Please try again.');
            }
        });
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

    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'resolved': return 'status-resolved';
            case 'inprogress': return 'status-inprogress'; // Handle both formats just in case
            case 'in progress': return 'status-inprogress';
            default: return 'status-unknown';
        }
    }
}
