import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { NotificationType, ReadNotificationDto } from '../../../models/notification.models';
import { ClientService } from '../../../services/client.service';
import { CraftsmanService } from '../../../services/craftsman.service';
import { AuthService } from '../../../services/auth.service';
import { OfferService, ClientDecision } from '../../../services/offer.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})
export class NotificationListComponent implements OnInit {
  notificationService = inject(NotificationService);
  clientService = inject(ClientService);
  craftsmanService = inject(CraftsmanService);
  authService = inject(AuthService);
  offerService = inject(OfferService);
  router = inject(Router);

  ngOnInit() {
    // Get current user from AuthService
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('NotificationList - No current user found');
      return;
    }

    console.log('NotificationList - Current user:', currentUser);
    console.log('NotificationList - User role:', currentUser.role);

    // Check user role and fetch appropriate notifications
    if (currentUser.role?.toLowerCase() === 'craftsman') {
      // User is a craftsman
      console.log('NotificationList - Fetching notifications for Craftsman');
      this.craftsmanService.getCurrentUserProfile().subscribe({
        next: (craftsman) => {
          console.log('NotificationList - Craftsman profile loaded:', craftsman);
          this.loadCraftsmanNotifications(craftsman.id);
        },
        error: (err) => console.error('NotificationList - Failed to load craftsman profile', err)
      });
    } else {
      // User is a client
      console.log('NotificationList - Fetching notifications for Client');
      this.clientService.getCurrentUserProfile().subscribe({
        next: (client) => {
          console.log('NotificationList - Client profile loaded:', client);
          this.loadClientNotifications(client.id);
        },
        error: (err) => console.error('NotificationList - Failed to load client profile', err)
      });
    }
  }

  loadClientNotifications(clientId: number) {
    console.log('NotificationList - Loading notifications for Client ID:', clientId);
    this.notificationService.getNotificationsForClient(clientId).subscribe({
      next: (data) => {
        console.log('NotificationList - Client notifications loaded:', data);
        console.log('🔍 DEBUG - Backend Response Analysis:');
        data.forEach((notif, index) => {
          console.log(`  Notification #${index + 1}:`, {
            id: notif.id,
            title: notif.title,
            isRead: notif.isRead,
            createdAt: notif.createdAt
          });
        });
        this.notificationService.updateNotificationsList(data);
      },
      error: (err) => console.error('NotificationList - Failed to load client notifications', err)
    });
  }

  loadCraftsmanNotifications(craftsmanId: number) {
    console.log('NotificationList - Loading notifications for Craftsman ID:', craftsmanId);
    this.notificationService.getNotificationsForCraftsman(craftsmanId).subscribe({
      next: (data) => {
        console.log('NotificationList - Craftsman notifications loaded:', data);
        console.log('🔍 DEBUG - Backend Response Analysis:');
        data.forEach((notif, index) => {
          console.log(`  Notification #${index + 1}:`, {
            id: notif.id,
            title: notif.title,
            isRead: notif.isRead,
            createdAt: notif.createdAt
          });
        });
        this.notificationService.updateNotificationsList(data);
      },
      error: (err) => console.error('NotificationList - Failed to load craftsman notifications', err)
    });
  }

  onNotificationClick(notification: ReadNotificationDto) {
    // DEBUG: Log the notification
    console.log('🔔 Notification clicked:', notification);
    console.log('  - Title:', notification.title);
    console.log('  - Message:', notification.message);
    console.log('  - ServiceRequestId:', notification.serviceRequestId);
    console.log('  - OfferId:', notification.offerId);

    // Mark as read optimistically (update UI immediately)
    if (!notification.isRead && notification.id) {
      // Update local state first for instant UI feedback
      this.notificationService.markLocalAsRead(notification.id);

      // Only call backend if the ID looks like a real backend ID (not our generated timestamp)
      // Real backend IDs are typically small numbers, timestamps are 13+ digits
      const isRealBackendId = notification.id < 1000000000000; // Less than 1 trillion

      if (isRealBackendId) {
        console.log(`📤 Calling backend markAsRead API for notification ID: ${notification.id}`);
        // Then update backend in background
        this.notificationService.markAsRead(notification.id).subscribe({
          next: () => {
            console.log('✅ SUCCESS - Notification marked as read on backend:', notification.id);
            console.log('  - Notification Title:', notification.title);
            console.log('  - Current Time:', new Date().toISOString());
          },
          error: (err) => {
            console.error('❌ FAILED - Could not mark notification as read on backend');
            console.error('  - Notification ID:', notification.id);
            console.error('  - Error details:', err);
            console.error('  - Error status:', err.status);
            console.error('  - Error message:', err.message);
            // Revert local state if backend update fails
            this.notificationService.notifications.update(current =>
              current.map(n => n.id === notification.id ? { ...n, isRead: false } : n)
            );
          }
        });
      } else {
        console.log('⚠️ Skipping backend update - using frontend-generated ID:', notification.id);
      }
    }

    // Get current user role
    const currentUser = this.authService.getCurrentUser();
    const isClient = currentUser?.role?.toLowerCase() !== 'craftsman';
    const title = notification.title?.toLowerCase() || '';

    console.log('🔍 User role:', isClient ? 'Client' : 'Craftsman');
    console.log('🔍 Notification title (lowercase):', title);

    // Handle different notification types based on title

    // 1. Craftsman Accepted - Client side (redirect to payment)
    if (isClient && title.includes('craftsman accepted')) {
      console.log('✅ Craftsman Accepted → Redirecting to payment page');
      if (notification.serviceRequestId) {
        this.router.navigate(['/payment', notification.serviceRequestId]);
      }
      return;
    }

    // 2. Craftsman Rejected - Client side (show alert)
    if (isClient && (title.includes('craftsman rejected') || title.includes('rejected your'))) {
      console.log('❌ Craftsman Rejected → Showing alert');
      Swal.fire({
        icon: 'info',
        title: 'Offer Rejected',
        text: notification.message || `Craftsman has rejected your service request.`,
        confirmButtonColor: '#FDB813'
      });
      return;
    }

    // 3. New Offer From Craftsman - Client side (redirect to offer review)
    if (isClient && (title.includes('new offer') || title.includes('price offered'))) {
      console.log('💰 New Offer → Redirecting to offer review page');
      if (notification.serviceRequestId) {
        const offerId = notification.offerId || notification.id;
        this.router.navigate(['/offer-review', notification.serviceRequestId, offerId], {
          state: {
            offerAmount: notification.finalAmount,
            offerDescription: notification.description,
            craftsmanName: notification.craftsManName
          }
        });
      }
      return;
    }

    // 4. Client Rejected Offer - Craftsman side (show alert)
    if (!isClient && (title.includes('client rejected') || title.includes('rejected your'))) {
      console.log('❌ Client Rejected → Showing alert');
      Swal.fire({
        icon: 'info',
        title: 'Offer Rejected',
        text: notification.message || 'The client has rejected your offer.',
        confirmButtonColor: '#FDB813'
      });
      return;
    }

    // 5. Client Accepted Offer - Craftsman side (navigate to service request details)
    if (!isClient && title.includes('client accepted')) {
      console.log('✅ Client Accepted → Navigating to offer details');
      if (notification.serviceRequestId) {
        this.router.navigate(['/offers', notification.serviceRequestId]);
      }
      return;
    }

    // 6. Service Request Scheduled - Craftsman side (navigate to service request)
    if (!isClient && title.includes('service request scheduled')) {
      console.log('📅 Service Scheduled → Navigating to offer details');
      if (notification.serviceRequestId) {
        this.router.navigate(['/offers', notification.serviceRequestId]);
      }
      return;
    }

    // Default fallback - navigate based on user role
    console.log('⚠️ No specific handler matched, using default navigation');
    if (notification.serviceRequestId) {
      if (isClient) {
        // Client default: go to offer review
        const offerId = notification.offerId || notification.id;
        this.router.navigate(['/offer-review', notification.serviceRequestId, offerId]);
      } else {
        // Craftsman default: go to offers page
        this.router.navigate(['/offers', notification.serviceRequestId]);
      }
    } else {
      console.warn('⚠️ Notification has no serviceRequestId:', notification);
    }
  }


  showOfferResponseDialog(notification: ReadNotificationDto) {
    const finalAmount = notification.finalAmount || 0;
    const description = notification.description || 'No description provided';
    const craftsmanName = notification.craftsmanName || 'Craftsman';
    const offerId = notification.offerId || notification.id;
    const serviceRequestId = notification.serviceRequestId;

    Swal.fire({
      title: '💰 New Offer Received!',
      html: `
        <div style="text-align: left; max-width: 450px; margin: 0 auto;">
          <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 14px; color: #6B7280; margin: 0 0 5px 0;">
              From
            </p>
            <p style="font-size: 16px; font-weight: 600; color: #374151; margin: 0;">
              ${craftsmanName}
            </p>
          </div>

          <div style="background: #FEF3E2; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #FDB813;">
            <p style="font-size: 14px; color: #6B7280; margin: 0 0 5px 0;">
              Offered Price
            </p>
            <p style="font-size: 28px; font-weight: 700; color: #FDB813; margin: 0;">
              ${finalAmount.toFixed(2)} EGP
            </p>
          </div>

          <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 14px; color: #6B7280; margin: 0 0 8px 0; font-weight: 600;">
              Description
            </p>
            <p style="font-size: 14px; color: #374151; margin: 0; line-height: 1.6;">
              ${description}
            </p>
          </div>

          <div style="background: #EFF6FF; padding: 12px; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <p style="font-size: 13px; color: #1E40AF; margin: 0;">
              ℹ️ Accept or decline this offer
            </p>
          </div>
        </div>
      `,
      icon: undefined,
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: '✅ Accept Offer',
      denyButtonText: '❌ Decline Offer',
      confirmButtonColor: '#10B981',
      denyButtonColor: '#DC2626',
      allowOutsideClick: false,
      width: '550px'
    }).then((result) => {
      if (result.isConfirmed) {
        // Client accepted - pass serviceRequestId for routing to payment
        this.respondToOffer(offerId, ClientDecision.Accept, serviceRequestId);
      } else if (result.isDenied) {
        // Client rejected
        this.respondToOffer(offerId, ClientDecision.Reject);
      }
    });
  }

  respondToOffer(offerId: number, decision: ClientDecision, serviceRequestId?: number) {
    this.offerService.clientRespond({ offerId, decision }).subscribe({
      next: () => {
        if (decision === ClientDecision.Accept && serviceRequestId) {
          // Client accepted - route to payment page
          Swal.fire({
            icon: 'success',
            title: 'Offer Accepted!',
            text: 'Redirecting to payment page...',
            confirmButtonColor: '#FDB813',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/payment', serviceRequestId]);
          });
        } else {
          // Client rejected
          Swal.fire({
            icon: 'success',
            title: 'Response Sent',
            text: 'You have declined the offer.',
            confirmButtonColor: '#FDB813',
            timer: 3000
          });

          // Refresh notifications
          const currentUser = this.authService.getCurrentUser();
          if (currentUser?.role?.toLowerCase() !== 'craftsman') {
            this.clientService.getCurrentUserProfile().subscribe({
              next: (client) => this.loadClientNotifications(client.id)
            });
          }
        }
      },
      error: (err) => {
        console.error('Failed to respond to offer:', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Respond',
          text: 'An error occurred. Please try again.',
          confirmButtonColor: '#FDB813'
        });
      }
    });
  }


  getIconForType(notification: ReadNotificationDto): string {
    const title = notification.title?.toLowerCase() || '';

    // Accepted notifications
    if (title.includes('accepted')) {
      return '✅';
    }

    // Rejected notifications
    if (title.includes('rejected')) {
      return '❌';
    }

    // New offer / price offered
    if (title.includes('new offer') || title.includes('price offered')) {
      return '💰';
    }

    // Scheduled / confirmed
    if (title.includes('scheduled') || title.includes('confirmed')) {
      return '📅';
    }

    // Service completed
    if (title.includes('completed')) {
      return '🎉';
    }

    // Payment related
    if (title.includes('payment')) {
      return '💳';
    }

    // Default notification icon
    return 'ℹ️';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }
}
