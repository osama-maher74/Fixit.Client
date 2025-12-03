import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { OfferService } from '../../services/offer.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { getSwalThemeConfig } from '../../helpers/swal-theme.helper';
import { environment } from '../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './offers.html',
  styleUrl: './offers.css'
})
export class OffersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceRequestService = inject(ServiceRequestService);
  private offerService = inject(OfferService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  serviceRequest: ServiceRequestResponse | null = null;
  loading = true;
  error: string | null = null;
  actionTaken = false;
  apiUrl = environment.apiUrl;

  ngOnInit() {
    // Get serviceRequestId from route parameters
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadServiceRequest(+id);
      } else {
        this.error = 'No service request ID provided';
        this.loading = false;
      }
    });
  }

  loadServiceRequest(id: number) {
    this.loading = true;
    this.serviceRequestService.getServiceRequestById(id).subscribe({
      next: (data) => {
        console.log('Service request loaded:', data);
        this.serviceRequest = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load service request:', err);
        this.error = 'Failed to load service request details';
        this.loading = false;
      }
    });
  }

  onAccept() {
    // Hide buttons immediately
    this.actionTaken = true;

    if (!this.serviceRequest?.id && !this.serviceRequest?.servicesRequestId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Service request ID not found',
        confirmButtonColor: '#FDB813'
      });
      return;
    }

    const serviceRequestId = this.serviceRequest.id || this.serviceRequest.servicesRequestId || 0;

    Swal.fire({
      ...getSwalThemeConfig(this.themeService.isDark()),
      title: 'Accept Offer?',
      text: 'Are you sure you want to accept this service request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: this.themeService.isDark() ? '#555555' : '#6B7280',
      confirmButtonText: 'Yes, Accept',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.offerService.craftsmanAccept({ serviceRequestId }).subscribe({
          next: () => {
            Swal.fire({
              ...getSwalThemeConfig(this.themeService.isDark()),
              icon: 'success',
              title: 'Offer Accepted!',
              text: 'You have successfully accepted this service request',
              timer: 3000
            });
            // Optionally navigate away or refresh data
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 3000);
          },
          error: (err) => {
            console.error('Failed to accept offer:', err);
            Swal.fire({
              ...getSwalThemeConfig(this.themeService.isDark()),
              icon: 'error',
              title: 'Failed to Accept',
              text: 'An error occurred while accepting the offer. Please try again.'
            });
          }
        });
      }
    });
  }

  onReject() {
    // Hide buttons immediately
    this.actionTaken = true;

    if (!this.serviceRequest?.id && !this.serviceRequest?.servicesRequestId) {
      Swal.fire({
        ...getSwalThemeConfig(this.themeService.isDark()),
        icon: 'error',
        title: 'Error',
        text: 'Service request ID not found'
      });
      return;
    }

    const serviceRequestId = this.serviceRequest.id || this.serviceRequest.servicesRequestId || 0;

    Swal.fire({
      ...getSwalThemeConfig(this.themeService.isDark()),
      title: 'Reject Offer?',
      text: 'Are you sure you want to reject this service request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: this.themeService.isDark() ? '#555555' : '#6B7280',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.offerService.craftsmanReject({ serviceRequestId }).subscribe({
          next: () => {
            Swal.fire({
              ...getSwalThemeConfig(this.themeService.isDark()),
              icon: 'success',
              title: 'Offer Rejected',
              text: 'You have rejected this service request',
              timer: 3000
            });
            // Optionally navigate away or refresh data
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 3000);
          },
          error: (err) => {
            console.error('Failed to reject offer:', err);
            Swal.fire({
              ...getSwalThemeConfig(this.themeService.isDark()),
              icon: 'error',
              title: 'Failed to Reject',
              text: 'An error occurred while rejecting the offer. Please try again.'
            });
          }
        });
      }
    });
  }

  onNewOffer() {
    // Hide buttons immediately
    this.actionTaken = true;

    if (!this.serviceRequest?.id && !this.serviceRequest?.servicesRequestId) {
      Swal.fire({
        ...getSwalThemeConfig(this.themeService.isDark()),
        icon: 'error',
        title: 'Error',
        text: 'Service request ID not found'
      });
      return;
    }

    // Get serviceRequestId from the loaded service request
    const serviceRequestId = this.serviceRequest.id || this.serviceRequest.servicesRequestId || 0;

    // Get theme colors
    const isDark = this.themeService.isDark();
    const labelColor = isDark ? '#F0F0F0' : '#374151';
    const inputBg = isDark ? '#333333' : '#FFFFFF';
    const inputBorder = isDark ? '#555555' : '#E5E7EB';
    const inputText = isDark ? '#F0F0F0' : '#1F2937';
    const placeholderColor = isDark ? '#808080' : '#9CA3AF';

    // Show themed form modal
    Swal.fire({
      ...getSwalThemeConfig(isDark),
      title: 'Submit New Offer',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: ${labelColor};">
              Final Amount (EGP)
            </label>
            <input 
              id="finalAmount" 
              type="number" 
              min="0" 
              step="0.01"
              class="swal2-input" 
              placeholder="Enter amount in EGP"
              style="width: 100%; padding: 12px; border: 1.5px solid ${inputBorder}; border-radius: 8px; font-size: 16px; background-color: ${inputBg}; color: ${inputText};"
            />
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: ${labelColor};">
              Description
            </label>
            <textarea 
              id="description" 
              class="swal2-textarea" 
              placeholder="Describe your offer details..."
              rows="4"
              style="width: 100%; padding: 12px; border: 1.5px solid ${inputBorder}; border-radius: 8px; font-size: 16px; resize: vertical; background-color: ${inputBg}; color: ${inputText};"
            ></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit Offer',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#FDB813',
      cancelButtonColor: isDark ? '#555555' : '#6B7280',
      focusConfirm: false,
      didOpen: () => {
        // Apply placeholder color styling
        const style = document.createElement('style');
        style.textContent = `
          #finalAmount::placeholder,
          #description::placeholder {
            color: ${placeholderColor};
          }
        `;
        document.head.appendChild(style);
      },
      preConfirm: () => {
        const finalAmountInput = document.getElementById('finalAmount') as HTMLInputElement;
        const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;

        const finalAmount = parseFloat(finalAmountInput.value);
        const description = descriptionInput.value.trim();

        if (!finalAmountInput.value || isNaN(finalAmount) || finalAmount <= 0) {
          Swal.showValidationMessage('Please enter a valid amount greater than 0');
          return false;
        }

        if (!description) {
          Swal.showValidationMessage('Please provide a description for your offer');
          return false;
        }

        return { finalAmount, description };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // Get craftsman ID from the loaded service request
        const craftsmanId = this.serviceRequest!.craftsManId || 0;

        if (!craftsmanId) {
          Swal.fire({
            ...getSwalThemeConfig(this.themeService.isDark()),
            icon: 'error',
            title: 'Error',
            text: 'Craftsman ID not found in service request.'
          });
          return;
        }

        const newOfferData = {
          serviceRequestId: serviceRequestId,
          craftsmanId: craftsmanId,
          finalAmount: result.value.finalAmount,
          description: result.value.description
        };

        console.log('Submitting new offer:', newOfferData);

        this.offerService.craftsmanNewOffer(newOfferData).subscribe({
          next: () => {
            console.log('New offer submitted successfully');
            Swal.fire({
              ...getSwalThemeConfig(this.themeService.isDark()),
              icon: 'success',
              title: 'Offer Submitted!',
              text: 'Your new offer has been sent to the client successfully.',
              timer: 3000
            });
          },
          error: (err) => {
            console.error('Failed to submit new offer:', err);
            Swal.fire({
              ...getSwalThemeConfig(this.themeService.isDark()),
              icon: 'error',
              title: 'Submission Failed',
              text: err.error?.message || 'Failed to submit your offer. Please try again.'
            });
          }
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  get isCraftsman(): boolean {
    const user = this.authService.getCurrentUser();
    const result = user?.role?.toLowerCase() === 'craftsman';
    console.log('🔍 Offers Page - isCraftsman check:');
    console.log('  - User:', user);
    console.log('  - User role:', user?.role);
    console.log('  - Role lowercase:', user?.role?.toLowerCase());
    console.log('  - isCraftsman result:', result);
    return result;
  }

  /**
   * Check if service request is in InProgress or Completed status
   * If true, hide all action buttons
   */
  get shouldHideButtons(): boolean {
    if (!this.serviceRequest) return false;

    const statusName = this.getStatusEnumName(this.serviceRequest.status);
    const isInProgressOrCompleted = statusName === 'InProgress' || statusName === 'Completed';

    console.log('🔍 Should Hide Buttons Check:');
    console.log('  - Status:', this.serviceRequest.status);
    console.log('  - Status Name:', statusName);
    console.log('  - Should Hide:', isInProgressOrCompleted);

    return isInProgressOrCompleted;
  }

  getImageUrl(): string {
    // Check for serviceRequestImage first (the image uploaded by the client)
    if (this.serviceRequest?.serviceRequestImage) {
      // Check if it's already a full URL
      if (this.serviceRequest.serviceRequestImage.startsWith('http')) {
        return this.serviceRequest.serviceRequestImage;
      }
      // Otherwise prepend the API base URL
      return `${this.apiUrl}${this.serviceRequest.serviceRequestImage}`;
    }

    // Fallback to imageUrl if serviceRequestImage is not available
    if (this.serviceRequest?.imageUrl) {
      // Check if it's already a full URL
      if (this.serviceRequest.imageUrl.startsWith('http')) {
        return this.serviceRequest.imageUrl;
      }
      // Otherwise prepend the API base URL
      return `${this.apiUrl}${this.serviceRequest.imageUrl}`;
    }

    // Return a default service-related image if no image is available
    return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Map numeric status values to enum names
   */
  private getStatusEnumName(status: any): string {
    // Handle null/undefined
    if (status === null || status === undefined) return 'Pending';

    // If it's already a string, return it
    if (typeof status === 'string') return status;

    // Map numeric values to enum names based on C# enum
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'WaitingForCraftsmanResponse',
      2: 'WaitingForClientDecision',
      3: 'WaitingForClientPayment',
      4: 'RejectedByCraftsman',
      5: 'RejectedByClient',
      6: 'InProgress',
      7: 'Completed',
      8: 'Approved',
      9: 'Cancelled',
      10: 'CancelledDueToNonPayment'
    };

    const numericStatus = Number(status);
    return statusMap[numericStatus] || 'Pending';
  }

  getStatusClass(status: any): string {
    const statusName = this.getStatusEnumName(status);
    const statusStr = statusName.toLowerCase();

    // Map backend status to CSS classes
    if (statusStr.includes('waiting')) return 'waiting';
    if (statusStr.includes('reject')) return 'rejected';
    if (statusStr.includes('approved') || statusStr.includes('completed')) return 'approved';
    if (statusStr.includes('inprogress')) return 'inprogress';
    if (statusStr.includes('cancel')) return 'cancelled';
    if (statusStr === 'pending') return 'pending';

    return 'pending';
  }

  /**
   * Get translation key for status
   */
  formatStatus(status: any): string {
    const statusName = this.getStatusEnumName(status);

    // Convert to uppercase snake_case for translation key
    // e.g., "WaitingForCraftsmanResponse" -> "WAITING_FOR_CRAFTSMAN_RESPONSE"
    const translationKey = statusName
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');

    return `OFFERS.STATUS_VALUES.${translationKey}`;
  }
}
