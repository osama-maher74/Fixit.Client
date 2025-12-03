import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ClientService } from '../../services/client.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { OfferService } from '../../services/offer.service';
import { ThemeService } from '../../services/theme.service';
import { ReadNotificationDto, NotificationType } from '../../models/notification.models';
import { getSwalThemeConfig } from '../../helpers/swal-theme.helper';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule],
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
    privatelocation = inject(Location);
    private notificationService = inject(NotificationService);
    private authService = inject(AuthService);
    private clientService = inject(ClientService);
    private craftsmanService = inject(CraftsmanService);
    private translateService = inject(TranslateService);
    private router = inject(Router);
    private offerService = inject(OfferService);
    private themeService = inject(ThemeService);
    private locationService = inject(Location);

    notifications = signal<ReadNotificationDto[]>([]);
    isLoading = signal<boolean>(true);

    ngOnInit() {
        this.loadNotifications();
    }

    loadNotifications() {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            this.isLoading.set(false);
            return;
        }

        if (currentUser.role?.toLowerCase() === 'craftsman') {
            this.craftsmanService.getCurrentUserProfile().subscribe({
                next: (craftsman) => {
                    this.notificationService.getNotificationsForCraftsman(craftsman.id).subscribe({
                        next: (data) => {
                            this.notifications.set(this.sortNotifications(data));
                            this.isLoading.set(false);
                        },
                        error: () => this.isLoading.set(false)
                    });
                },
                error: () => this.isLoading.set(false)
            });
        } else {
            this.clientService.getCurrentUserProfile().subscribe({
                next: (client) => {
                    this.notificationService.getNotificationsForClient(client.id).subscribe({
                        next: (data) => {
                            this.notifications.set(this.sortNotifications(data));
                            this.isLoading.set(false);
                        },
                        error: () => this.isLoading.set(false)
                    });
                },
                error: () => this.isLoading.set(false)
            });
        }
    }

    private sortNotifications(data: ReadNotificationDto[]): ReadNotificationDto[] {
        return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    goBack(): void {
        this.locationService.back();
    }

    onNotificationClick(notification: ReadNotificationDto): void {
        // Mark as read logic
        if (!notification.isRead) {
            // Optimistic update
            this.notifications.update(items =>
                items.map(item => item.id === notification.id ? { ...item, isRead: true } : item)
            );

            this.notificationService.markAsRead(notification.id).subscribe({
                error: () => {
                    // Revert on error
                    this.notifications.update(items =>
                        items.map(item => item.id === notification.id ? { ...item, isRead: false } : item)
                    );
                }
            });
        }

        // Routing Logic
        const currentUser = this.authService.getCurrentUser();
        const isClient = currentUser?.role?.toLowerCase() !== 'craftsman';
        const title = notification.title?.toLowerCase() || '';

        // 1. Craftsman Accepted - Client side (redirect to payment)
        if (isClient && title.includes('craftsman accepted')) {
            if (notification.serviceRequestId) {
                this.router.navigate(['/payment', notification.serviceRequestId]);
            }
            return;
        }

        // 2. New Offer - Client side
        if (notification.type === NotificationType.NewOfferFromCraftsman) {
            const offerId = notification.offerId || notification.id;
            if (notification.serviceRequestId) {
                this.router.navigate(['/offer-review', notification.serviceRequestId, offerId], {
                    state: {
                        offerAmount: notification.finalAmount,
                        offerDescription: notification.description,
                        craftsmanName: notification.craftsmanName || notification.craftsManName
                    }
                });
            }
            return;
        }

        // 3. Client Rejected Offer - Craftsman side (show alert)
        if (!isClient && (title.includes('client rejected') || title.includes('rejected your'))) {
            Swal.fire({
                ...getSwalThemeConfig(this.themeService.isDark()),
                icon: 'info',
                title: 'Offer Rejected',
                text: notification.message || 'The client has rejected your offer.'
            });
            return;
        }

        // 4. Client Accepted Offer - Craftsman side
        if (!isClient && title.includes('client accepted')) {
            if (notification.serviceRequestId) {
                this.router.navigate(['/offers', notification.serviceRequestId]);
            }
            return;
        }

        // 5. Service Request Scheduled - Craftsman side
        if (!isClient && title.includes('service request scheduled')) {
            if (notification.serviceRequestId) {
                this.router.navigate(['/offers', notification.serviceRequestId]);
            }
            return;
        }

        // Default fallback
        if (notification.serviceRequestId) {
            if (isClient) {
                const offerId = notification.offerId || notification.id;
                this.router.navigate(['/offer-review', notification.serviceRequestId, offerId]);
            } else {
                this.router.navigate(['/offers', notification.serviceRequestId]);
            }
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

    getTranslatedTitle(notification: ReadNotificationDto): string {
        console.log('Processing notification:', notification.id, 'Type:', notification.type);
        let key = '';
        switch (notification.type) {
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
            default:
                console.log('No translation key found for type:', notification.type);
                return notification.title;
        }
        return key;
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
}
