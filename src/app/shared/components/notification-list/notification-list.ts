import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../services/notification.service';
import { NotificationType, ReadNotificationDto } from '../../../models/notification.models';
import { ClientService } from '../../../services/client.service';
import { CraftsmanService } from '../../../services/craftsman.service';
import { AuthService } from '../../../services/auth.service';
import { OfferService, ClientDecision } from '../../../services/offer.service';
import { ThemeService } from '../../../services/theme.service';
import { getSwalThemeConfig } from '../../../helpers/swal-theme.helper';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})
export class NotificationListComponent implements OnInit {
  notificationService = inject(NotificationService);
  clientService = inject(ClientService);
  craftsmanService = inject(CraftsmanService);
  authService = inject(AuthService);
  offerService = inject(OfferService);
  themeService = inject(ThemeService);
  translateService = inject(TranslateService);
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
    if (currentUser.role?.toLowerCase() === 'admin') {
      // User is an admin
      console.log('NotificationList - Fetching notifications for Admin');
      this.loadAdminNotifications();
    } else if (currentUser.role?.toLowerCase() === 'craftsman') {
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

  loadAdminNotifications() {
    console.log('NotificationList - Loading notifications for Admin');
    this.notificationService.getNotificationsForAdmin().subscribe({
      next: (data) => {
        console.log('NotificationList - Admin notifications loaded:', data);
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
      error: (err) => console.error('NotificationList - Failed to load admin notifications', err)
    });
  }

  onNotificationClick(notification: ReadNotificationDto) {
    // DEBUG: Log the notification
    console.log('🔔 Notification clicked:', notification);
    console.log('Notification ID:', notification.id);
    console.log('Notification type:', notification.type);
    console.log('Notification type (string):', typeof notification.type, notification.type);
    console.log('NotificationType.WithdrawalRequested:', NotificationType.WithdrawalRequested);
    console.log('Type match?', notification.type === NotificationType.WithdrawalRequested);
    console.log('Notification isRead:', notification.isRead);  // ✅ Check isRead status
    console.log('Notification finalAmount:', notification.finalAmount);
    console.log('Notification offerId:', notification.offerId);
    console.log('Notification craftsManId:', notification.craftsManId);

    // Mark as read optimistically (update UI immediately)
    if (!notification.isRead && notification.id) {
      console.log('📝 Marking notification as read:', notification.id);
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
    const isClient = currentUser?.role?.toLowerCase() === 'client';
    const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
    const title = notification.title?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';

    console.log('🔍 User role:', isAdmin ? 'Admin' : (isClient ? 'Client' : 'Craftsman'));
    console.log('🔍 Current user full object:', currentUser);
    console.log('🔍 isAdmin value:', isAdmin);
    console.log('🔍 Notification title (lowercase):', title);

    // Handle different notification types based on title

    // 0. Admin - Withdrawal Requested (navigate to craftsman wallet)
    console.log('🔍 Checking withdrawal condition...');
    console.log('   isAdmin:', isAdmin);
    console.log('   notification.type:', notification.type);
    console.log('   NotificationType.WithdrawalRequested:', NotificationType.WithdrawalRequested);

    // Convert numeric type to string enum for comparison
    const notificationTypeEnum = typeof notification.type === 'number'
      ? this.mapNumericTypeToEnum(notification.type)
      : notification.type;

    console.log('   Converted type:', notificationTypeEnum);
    console.log('   Types match:', notificationTypeEnum === NotificationType.WithdrawalRequested);

    if (isAdmin && notificationTypeEnum === NotificationType.WithdrawalRequested) {
      console.log('✅ MATCHED: Admin + WithdrawalRequested');
      const craftsmanId = notification.craftsManId || notification.clientId;
      console.log('   craftsManId from notification:', craftsmanId);
      if (craftsmanId) {
        console.log('✅ Withdrawal Request → Redirecting to craftsman wallet:', craftsmanId);
        this.router.navigate(['/craftsman-wallet', craftsmanId]);
      } else {
        console.error('❌ No craftsmanId found in notification!');
        console.error('Full notification object:', notification);
        // Show error to user
        Swal.fire({
          ...getSwalThemeConfig(this.themeService.isDark()),
          icon: 'error',
          title: 'Cannot View Wallet',
          text: 'Craftsman information is missing from this notification. Please contact support.'
        });
      }
      return;
    } else {
      console.log('❌ Did NOT match withdrawal condition');
    }

    // 0.5. Fallback: Check if message contains "withdrawal" (temporary fix for backend issue)
    if (isAdmin && (message.includes('withdrawal') || message.includes('withdraw'))) {
      const craftsmanId = notification.craftsManId || notification.clientId;
      if (craftsmanId) {
        console.log('✅ Withdrawal detected in message → Redirecting to craftsman wallet');
        this.router.navigate(['/craftsman-wallet', craftsmanId]);
      } else {
        console.error('❌ No craftsmanId in withdrawal notification');
        Swal.fire({
          ...getSwalThemeConfig(this.themeService.isDark()),
          icon: 'error',
          title: 'Cannot View Wallet',
          text: 'Craftsman information is missing from this notification. Please contact support.'
        });
      }
      return;
    }

    // 0.6. Admin - Service Cancelled or Craftsman No-Show (navigate to request-details)
    if (isAdmin && (notificationTypeEnum === NotificationType.ServiceCancelled || notificationTypeEnum === NotificationType.CraftsmanNoShow)) {
      console.log('✅ Service Cancelled/No-Show → Redirecting to request details');
      if (notification.serviceRequestId) {
        this.router.navigate(['/request-details', notification.serviceRequestId]);
      } else {
        console.error('❌ No serviceRequestId in cancellation notification');
      }
      return;
    }

    // 1. Craftsman Accepted - Client side (redirect to payment)
    if (isClient && title.includes('craftsman accepted')) {
      console.log('✅ Craftsman Accepted → Redirecting to payment page');
      if (notification.serviceRequestId) {
        this.router.navigate(['/payment', notification.serviceRequestId]);
      }
      return;
    }

    // 1.5. Craftsman Apologized - Client side (redirect to client-choice page)
    // Check by type OR by title (fallback for type number mismatch)
    const isCraftsmanApologized = notificationTypeEnum === NotificationType.CraftsmanApologized ||
      title.includes('cancelled') ||
      title.includes('apologized') ||
      title.includes('apology');

    if (isClient && isCraftsmanApologized) {
      console.log('🙏 Craftsman Apologized → Redirecting to client-choice page');
      if (notification.serviceRequestId) {
        this.router.navigate(['/client-choice', notification.serviceRequestId]);
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
    if (!isClient && !isAdmin && (title.includes('client rejected') || title.includes('rejected your'))) {
      console.log('❌ Client Rejected → Showing alert');
      Swal.fire({
        ...getSwalThemeConfig(this.themeService.isDark()),
        icon: 'info',
        title: this.translateService.instant('NOTIFICATIONS.ALERTS.OFFER_REJECTED_TITLE'),
        text: notification.message || this.translateService.instant('NOTIFICATIONS.ALERTS.OFFER_REJECTED_TEXT')
      });
      return;
    }

    // 5. Client Accepted Offer - Craftsman side (navigate to service request details)
    if (!isClient && !isAdmin && title.includes('client accepted')) {
      console.log('✅ Client Accepted → Navigating to offer details');
      if (notification.serviceRequestId) {
        this.router.navigate(['/offers', notification.serviceRequestId]);
      }
      return;
    }

    // 6. Service Request Scheduled - Craftsman side (navigate to service request)
    if (!isClient && !isAdmin && title.includes('service request scheduled')) {
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
      } else if (isAdmin) {
        // Admin default: navigate to request details
        this.router.navigate(['/request-details', notification.serviceRequestId]);
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
    const description = notification.description || this.translateService.instant('NOTIFICATIONS.ALERTS.NO_DESCRIPTION');
    const craftsmanName = notification.craftsmanName || this.translateService.instant('NOTIFICATIONS.ALERTS.CRAFTSMAN');
    const offerId = notification.offerId || notification.id;
    const serviceRequestId = notification.serviceRequestId;

    const isDark = this.themeService.isDark();
    const bgPrimary = isDark ? '#333333' : '#F9FAFB';
    const bgSecondary = isDark ? '#2A2A2A' : '#FFFFFF';
    const textPrimary = isDark ? '#F0F0F0' : '#374151';
    const textSecondary = isDark ? '#B8B8B8' : '#6B7280';
    const accentBg = isDark ? 'rgba(253, 184, 19, 0.15)' : '#FEF3E2';
    const infoBg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    const infoText = isDark ? '#60A5FA' : '#1E40AF';

    Swal.fire({
      ...getSwalThemeConfig(isDark),
      title: '💰 ' + this.translateService.instant('NOTIFICATIONS.ALERTS.NEW_OFFER_TITLE'),
      html: `
        <div style="text-align: left; max-width: 450px; margin: 0 auto;">
          <div style="background: ${bgPrimary}; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 14px; color: ${textSecondary}; margin: 0 0 5px 0;">
              ${this.translateService.instant('NOTIFICATIONS.ALERTS.FROM')}
            </p>
            <p style="font-size: 16px; font-weight: 600; color: ${textPrimary}; margin: 0;">
              ${craftsmanName}
            </p>
          </div>

          <div style="background: ${accentBg}; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #FDB813;">
            <p style="font-size: 14px; color: ${textSecondary}; margin: 0 0 5px 0;">
              ${this.translateService.instant('NOTIFICATIONS.ALERTS.OFFERED_PRICE')}
            </p>
            <p style="font-size: 28px; font-weight: 700; color: #FDB813; margin: 0;">
              ${finalAmount.toFixed(2)} ${this.translateService.instant('NOTIFICATIONS.ALERTS.CURRENCY')}
            </p>
          </div>

          <div style="background: ${bgPrimary}; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 14px; color: ${textSecondary}; margin: 0 0 8px 0; font-weight: 600;">
              ${this.translateService.instant('NOTIFICATIONS.ALERTS.DESCRIPTION')}
            </p>
            <p style="font-size: 14px; color: ${textPrimary}; margin: 0; line-height: 1.6;">
              ${description}
            </p>
          </div>

          <div style="background: ${infoBg}; padding: 12px; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <p style="font-size: 13px; color: ${infoText}; margin: 0;">
              ℹ️ ${this.translateService.instant('NOTIFICATIONS.ALERTS.ACCEPT_OR_DECLINE')}
            </p>
          </div>
        </div>
      `,
      icon: undefined,
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: '✅ ' + this.translateService.instant('NOTIFICATIONS.ALERTS.ACCEPT_OFFER'),
      denyButtonText: '❌ ' + this.translateService.instant('NOTIFICATIONS.ALERTS.DECLINE_OFFER'),
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
            ...getSwalThemeConfig(this.themeService.isDark()),
            icon: 'success',
            title: this.translateService.instant('NOTIFICATIONS.ALERTS.OFFER_ACCEPTED_SUCCESS'),
            text: this.translateService.instant('NOTIFICATIONS.ALERTS.REDIRECTING_TO_PAYMENT'),
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/payment', serviceRequestId]);
          });
        } else {
          // Client rejected
          Swal.fire({
            ...getSwalThemeConfig(this.themeService.isDark()),
            icon: 'success',
            title: this.translateService.instant('NOTIFICATIONS.ALERTS.RESPONSE_SENT'),
            text: this.translateService.instant('NOTIFICATIONS.ALERTS.OFFER_DECLINED'),
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
          ...getSwalThemeConfig(this.themeService.isDark()),
          icon: 'error',
          title: this.translateService.instant('NOTIFICATIONS.ALERTS.FAILED_TO_RESPOND'),
          text: this.translateService.instant('NOTIFICATIONS.ALERTS.ERROR_OCCURRED')
        });
      }
    });
  }


  getTranslatedTitle(notification: ReadNotificationDto): string {
    let key = '';

    // Convert numeric type to string enum if needed
    const type = typeof notification.type === 'number' ? this.mapNumericTypeToEnum(notification.type) : notification.type;

    switch (type) {
      case NotificationType.SelectCraftsman:
        key = 'NOTIFICATIONS.TYPE_SELECT_CRAFTSMAN';
        break;
      case NotificationType.CraftsmanAccepted:
        key = 'NOTIFICATIONS.TYPE_CRAFTSMAN_ACCEPTED';
        break;
      case NotificationType.ClientAcceptedOffer:
        key = 'NOTIFICATIONS.TYPE_CLIENT_ACCEPTED';
        break;
      case NotificationType.CraftsmanRejected:
        key = 'NOTIFICATIONS.TYPE_CRAFTSMAN_REJECTED';
        break;
      case NotificationType.ClientRejectedOffer:
        key = 'NOTIFICATIONS.TYPE_CLIENT_REJECTED';
        break;
      case NotificationType.NewOfferFromCraftsman:
        key = 'NOTIFICATIONS.TYPE_NEW_OFFER';
        break;
      case NotificationType.PaymentRequested:
        key = 'NOTIFICATIONS.TYPE_PAYMENT_REQUESTED';
        break;
      case NotificationType.ServiceRequestScheduled:
        key = 'NOTIFICATIONS.TYPE_SERVICE_SCHEDULED';
        break;
      case NotificationType.WithdrawalRequested:
        key = 'NOTIFICATIONS.TYPE_WITHDRAWAL_REQUESTED';
        break;
      case NotificationType.WithdrawalApproved:
        key = 'NOTIFICATIONS.TYPE_WITHDRAWAL_APPROVED';
        break;
      case NotificationType.ServiceCancelled:
        key = 'NOTIFICATIONS.TYPE_SERVICE_CANCELLED';
        break;
      case NotificationType.CraftsmanNoShow:
        key = 'NOTIFICATIONS.TYPE_CRAFTSMAN_NO_SHOW';
        break;
      case NotificationType.CraftsmanApologized:
        key = 'NOTIFICATIONS.TYPE_CRAFTSMAN_APOLOGIZED';
        break;
      default:
        return notification.title;
    }
    return key;
  }

  private mapNumericTypeToEnum(type: number): NotificationType {
    // Map backend numeric values to enum
    // IMPORTANT: This mapping must match the backend enum order exactly
    const mapping: { [key: number]: NotificationType } = {
      0: NotificationType.SelectCraftsman,
      1: NotificationType.CraftsmanAccepted,
      2: NotificationType.CraftsmanRejected,
      3: NotificationType.NewOfferFromCraftsman,
      4: NotificationType.ClientAcceptedOffer,
      5: NotificationType.ClientRejectedOffer,
      6: NotificationType.PaymentRequested,
      7: NotificationType.WithdrawalRequested,     // Admin: Withdrawal request notification
      8: NotificationType.WithdrawalApproved,      // Craftsman: Withdrawal approved notification
      9: NotificationType.ServiceCancelled,
      10: NotificationType.CraftsmanNoShow,
      11: NotificationType.CraftsmanApologized
    };
    console.log(`🔄 Mapping type ${type} to ${mapping[type] || 'Unknown'}`);
    return mapping[type] || NotificationType.SelectCraftsman;
  }

  getIconForType(type: NotificationType | number): string {
    // Convert numeric type to string enum if needed
    const enumType = typeof type === 'number' ? this.mapNumericTypeToEnum(type) : type;

    switch (enumType) {
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
      case NotificationType.ServiceRequestScheduled:
        return '📅';
      case NotificationType.WithdrawalRequested:
        return '💸';
      case NotificationType.WithdrawalApproved:
        return '✅';
      case NotificationType.ServiceCancelled:
        return '❌';
      case NotificationType.CraftsmanNoShow:
        return '⚠️';
      case NotificationType.CraftsmanApologized:
        return '🙏';
      default:
        return 'ℹ️';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return this.translateService.instant('NOTIFICATIONS.JUST_NOW');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return this.translateService.instant('NOTIFICATIONS.MINUTES_AGO', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return this.translateService.instant('NOTIFICATIONS.HOURS_AGO', { count: hours });
    return date.toLocaleDateString();
  }

  goToNotificationsPage(): void {
    this.router.navigate(['/notifications']);
  }
}
