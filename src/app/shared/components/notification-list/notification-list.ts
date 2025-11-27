import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { NotificationType, ReadNotificationDto } from '../../../models/notification.models';
import { ClientService } from '../../../services/client.service';
import { CraftsmanService } from '../../../services/craftsman.service';
import { AuthService } from '../../../services/auth.service';

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
    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        this.notificationService.markLocalAsRead(notification.id);
      });
    }

    // Navigate based on type (currently all go to service request details if we had that page)
    // For now, we can just log or navigate to a placeholder
    console.log('Navigate to service request:', notification.serviceRequestId);
    // this.router.navigate(['/service-request', notification.serviceRequestId]);
  }

  getIconForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.CraftsmanAccepted:
      case NotificationType.ClientAcceptedCraftsmanPrice:
        return '✅';
      case NotificationType.CraftsmanRejected:
      case NotificationType.PriceRejectedByCraftsman:
      case NotificationType.ClientRejectedCraftsmanPrice:
        return '❌';
      case NotificationType.NewPriceOfferedByCraftsman:
        return '💰';
      case NotificationType.ServiceCompleted:
        return '🎉';
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
