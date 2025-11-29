import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequestResponse } from '../../services/service-request.service';
import { OfferService } from '../../services/offer.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offers.html',
  styleUrl: './offers.css'
})
export class OffersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceRequestService = inject(ServiceRequestService);
  private offerService = inject(OfferService);
  private authService = inject(AuthService);

  serviceRequest: ServiceRequestResponse | null = null;
  loading = true;
  error: string | null = null;
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
      title: 'Accept Offer?',
      text: 'Are you sure you want to accept this service request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Accept',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.offerService.craftsmanAccept({ serviceRequestId }).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Offer Accepted!',
              text: 'You have successfully accepted this service request',
              confirmButtonColor: '#FDB813',
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
              icon: 'error',
              title: 'Failed to Accept',
              text: 'An error occurred while accepting the offer. Please try again.',
              confirmButtonColor: '#FDB813'
            });
          }
        });
      }
    });
  }

  onReject() {
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
      title: 'Reject Offer?',
      text: 'Are you sure you want to reject this service request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.offerService.craftsmanReject({ serviceRequestId }).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Offer Rejected',
              text: 'You have rejected this service request',
              confirmButtonColor: '#FDB813',
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
              icon: 'error',
              title: 'Failed to Reject',
              text: 'An error occurred while rejecting the offer. Please try again.',
              confirmButtonColor: '#FDB813'
            });
          }
        });
      }
    });
  }

  onNewOffer() {
    if (!this.serviceRequest?.id && !this.serviceRequest?.servicesRequestId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Service request ID not found',
        confirmButtonColor: '#FDB813'
      });
      return;
    }

    // Get serviceRequestId from the loaded service request
    const serviceRequestId = this.serviceRequest.id || this.serviceRequest.servicesRequestId || 0;

    // Show themed form modal
    Swal.fire({
      title: 'Submit New Offer',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
              Final Amount (EGP)
            </label>
            <input 
              id="finalAmount" 
              type="number" 
              min="0" 
              step="0.01"
              class="swal2-input" 
              placeholder="Enter amount in EGP"
              style="width: 100%; padding: 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 16px;"
            />
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">
              Description
            </label>
            <textarea 
              id="description" 
              class="swal2-textarea" 
              placeholder="Describe your offer details..."
              rows="4"
              style="width: 100%; padding: 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 16px; resize: vertical;"
            ></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit Offer',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#FDB813',
      cancelButtonColor: '#6B7280',
      focusConfirm: false,
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
            icon: 'error',
            title: 'Error',
            text: 'Craftsman ID not found in service request.',
            confirmButtonColor: '#FDB813'
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
              icon: 'success',
              title: 'Offer Submitted!',
              text: 'Your new offer has been sent to the client successfully.',
              confirmButtonColor: '#FDB813',
              timer: 3000
            });
          },
          error: (err) => {
            console.error('Failed to submit new offer:', err);
            Swal.fire({
              icon: 'error',
              title: 'Submission Failed',
              text: err.error?.message || 'Failed to submit your offer. Please try again.',
              confirmButtonColor: '#FDB813'
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
    return user?.role?.toLowerCase() === 'craftsman';
  }

  getImageUrl(): string {
    if (this.serviceRequest?.imageUrl) {
      // Check if it's already a full URL
      if (this.serviceRequest.imageUrl.startsWith('http')) {
        return this.serviceRequest.imageUrl;
      }
      // Otherwise prepend the API base URL
      return `${this.apiUrl}${this.serviceRequest.imageUrl}`;
    }
    return 'assets/offer-placeholder.png'; // Fallback image
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

  getStatusClass(status: any): string {
    if (!status) return '';
    return String(status).toLowerCase();
  }
}
