import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { OfferService } from '../../services/offer.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-client-choice',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './client-choice.component.html',
    styleUrl: './client-choice.component.css'
})
export class ClientChoiceComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private serviceRequestService = inject(ServiceRequestService);
    private offerService = inject(OfferService);
    private translate = inject(TranslateService);

    request: ServiceRequestResponse | null = null;
    loading = true;
    processing = false;
    error: string | null = null;
    apiUrl = environment.apiUrl;

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadRequestDetails(+id);
            } else {
                this.error = this.translate.instant('CLIENT_CHOICE.INVALID_REQUEST_ID');
                this.loading = false;
            }
        });
    }

    private loadRequestDetails(id: number) {
        this.loading = true;
        this.serviceRequestService.getServiceRequestById(id).subscribe({
            next: (data) => {
                this.request = data;
                this.loading = false;

                // Validate status is CancelledByCraftsman (11)
                const statusNum = typeof data.status === 'number' ? data.status : parseInt(data.status as any);
                if (statusNum !== 11) {
                    this.error = this.translate.instant('CLIENT_CHOICE.INVALID_STATUS');
                }
            },
            error: (err) => {
                console.error('Error loading request:', err);
                this.error = err.error?.message || this.translate.instant('CLIENT_CHOICE.LOAD_ERROR');
                this.loading = false;
            }
        });
    }

    getImageUrl(imagePath: string | undefined): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${this.apiUrl.replace('/api', '')}/${cleanPath}`;
    }

    formatDate(date: string | Date | undefined): string {
        if (!date) return this.translate.instant('CLIENT_CHOICE.NOT_SPECIFIED');
        return new Date(date).toLocaleDateString(this.translate.currentLang, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    chooseRefund() {
        if (!this.request || this.processing) return;

        Swal.fire({
            title: this.translate.instant('CLIENT_CHOICE.REFUND_CONFIRM_TITLE'),
            text: this.translate.instant('CLIENT_CHOICE.REFUND_CONFIRM_TEXT'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('CLIENT_CHOICE.YES_REFUND'),
            cancelButtonText: this.translate.instant('CLIENT_CHOICE.CANCEL'),
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280'
        }).then((result) => {
            if (result.isConfirmed) {
                this.processRefund();
            }
        });
    }

    private processRefund() {
        this.processing = true;
        const requestId = this.request!.servicesRequestId || this.request!.id;

        this.offerService.clientChooseRefund({ serviceRequestId: requestId! }).subscribe({
            next: (response) => {
                this.processing = false;
                Swal.fire({
                    icon: 'success',
                    title: this.translate.instant('CLIENT_CHOICE.REFUND_SUCCESS_TITLE'),
                    text: this.translate.instant('CLIENT_CHOICE.REFUND_SUCCESS_TEXT'),
                    confirmButtonColor: '#d4af37'
                }).then(() => {
                    this.router.navigate(['/my-requests']);
                });
            },
            error: (err) => {
                this.processing = false;
                Swal.fire({
                    icon: 'error',
                    title: this.translate.instant('CLIENT_CHOICE.REFUND_FAILED'),
                    text: err.error?.message || this.translate.instant('ERROR_DEFAULT'),
                    confirmButtonColor: '#d4af37'
                });
            }
        });
    }

    chooseNewCraftsman() {
        if (!this.request || this.processing) return;

        Swal.fire({
            title: this.translate.instant('CLIENT_CHOICE.NEW_CRAFTSMAN_CONFIRM_TITLE'),
            text: this.translate.instant('CLIENT_CHOICE.NEW_CRAFTSMAN_CONFIRM_TEXT'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('CLIENT_CHOICE.YES_NEW_CRAFTSMAN'),
            cancelButtonText: this.translate.instant('CLIENT_CHOICE.CANCEL'),
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280'
        }).then((result) => {
            if (result.isConfirmed) {
                this.processNewCraftsman();
            }
        });
    }

    private processNewCraftsman() {
        this.processing = true;
        const requestId = this.request!.servicesRequestId || this.request!.id;

        this.offerService.clientChooseNewCraftsman({ serviceRequestId: requestId! }).subscribe({
            next: (response) => {
                this.processing = false;
                Swal.fire({
                    icon: 'success',
                    title: this.translate.instant('CLIENT_CHOICE.NEW_CRAFTSMAN_SUCCESS_TITLE'),
                    text: this.translate.instant('CLIENT_CHOICE.NEW_CRAFTSMAN_SUCCESS_TEXT'),
                    confirmButtonColor: '#d4af37'
                }).then(() => {
                    // Navigate to service details to select new craftsman
                    this.router.navigate(['/service', this.request!.serviceId]);
                });
            },
            error: (err) => {
                this.processing = false;
                Swal.fire({
                    icon: 'error',
                    title: this.translate.instant('CLIENT_CHOICE.NEW_CRAFTSMAN_FAILED'),
                    text: err.error?.message || this.translate.instant('ERROR_DEFAULT'),
                    confirmButtonColor: '#d4af37'
                });
            }
        });
    }

    goBack() {
        this.router.navigate(['/my-requests']);
    }
}
