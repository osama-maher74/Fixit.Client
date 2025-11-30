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
        this.notificationService.updateNotificationsList(data);
      },
      error: (err) => console.error('NotificationList - Failed to load craftsman notifications', err)
    });
  }

  onNotificationClick(notification: ReadNotificationDto) {
    // DEBUG: Log the entire notification object
    console.log('🔔 Notification clicked:', notification);
    console.log('Notification ID:', notification.id);
    console.log('Notification type:', notification.type);
    console.log('Notification isRead:', notification.isRead);  // ✅ Check isRead status
    console.log('Notification finalAmount:', notification.finalAmount);
    console.log('Notification offerId:', notification.offerId);

    // Mark as read optimistically (update UI immediately)
    if (!notification.isRead && notification.id) {
      console.log('📝 Marking notification as read:', notification.id);
      // Update local state first for instant UI feedback
      this.notificationService.markLocalAsRead(notification.id);

      // Then update backend in background
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          console.log('✅ Notification marked as read on backend:', notification.id);
        },
        error: (err) => {
          console.error('❌ Failed to mark notification as read on backend:', err);
          // Revert local state if backend update fails
          this.notificationService.notifications.update(current =>
            current.map(n => n.id === notification.id ? { ...n, isRead: false } : n)
          );
        }
      });
    }

    // Get current user role
    const currentUser = this.authService.getCurrentUser();
    const isClient = currentUser?.role?.toLowerCase() !== 'craftsman';

    // Check if this is a craftsman accepted notification for client - route to payment
    if (isClient && notification.type === NotificationType.CraftsmanAccepted) {
      console.log('✅ Craftsman accepted - routing client to payment page');
      if (notification.serviceRequestId) {
        this.router.navigate(['/payment', notification.serviceRequestId]);
      }
      return;
    }

    // Check if this is a new offer notification for client
    if (notification.type === NotificationType.NewOfferFromCraftsman) {
      // Navigate to offer review page with offer details in route state
      const offerId = notification.offerId || notification.id;
      console.log('✅ Matched new offer notification - navigating with state:', {
        offerAmount: notification.finalAmount,
        offerDescription: notification.description,
        craftsmanName: notification.craftsmanName
      });
      if (notification.serviceRequestId) {
        this.router.navigate(['/offer-review', notification.serviceRequestId, offerId], {
          state: {
            offerAmount: notification.finalAmount,
            offerDescription: notification.description,
            craftsmanName: notification.craftsmanName
          }
        });
      }
      return;
    }

    // Route based on user role
    if (notification.serviceRequestId) {
      if (isClient) {
        // Client should go to offer-review page with offer details
        const offerId = notification.offerId || notification.id;
        console.log('📍 Client: Navigating to offer-review page with state:', {
          offerAmount: notification.finalAmount,
          offerDescription: notification.description,
          craftsmanName: notification.craftsmanName
        });
        this.router.navigate(['/offer-review', notification.serviceRequestId, offerId], {
          state: {
            offerAmount: notification.finalAmount,
            offerDescription: notification.description,
            craftsmanName: notification.craftsmanName
          }
        });
      } else {
        // Craftsman should go to offers page
        console.log('Craftsman: Navigating to offers page with service request ID:', notification.serviceRequestId);
        this.router.navigate(['/offers', notification.serviceRequestId]);
      }
    } else {
      console.warn('Notification has no serviceRequestId:', notification);
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


  getIconForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.CraftsmanAccepted:
      case NotificationType.ClientAcceptedOffer:
        return '✅';
      case NotificationType.CraftsmanRejected:
      case NotificationType.ClientRejectedOffer:
        return '❌';
      case NotificationType.NewOfferFromCraftsman:
        return '💰';
      case NotificationType.PaymentRequested:
        return '💳';
      default:
        return 'ℹ️';
    }
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
