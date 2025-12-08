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

        // Subscribe to real-time notifications from SignalR
        this.notificationService.notificationReceived$.subscribe({
            next: (newNotification) => {
                console.log('📨 Real-time notification received in notifications page:', newNotification);
                // Add the new notification to the top of the list
                this.notifications.update(current => {
                    // Check if notification already exists to avoid duplicates
                    const exists = current.some(n => n.id === newNotification.id);
                    if (exists) {
                        return current;
                    }
                    // Add new notification and re-sort
                    return this.sortNotifications([newNotification, ...current]);
                });
            },
            error: (err) => console.error('Error receiving real-time notification:', err)
        });
    }

    loadNotifications() {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            this.isLoading.set(false);
            return;
        }

        if (currentUser.role?.toLowerCase() === 'admin') {
            this.notificationService.getNotificationsForAdmin().subscribe({
                next: (data) => {
                    this.notifications.set(this.sortNotifications(data));
                    this.isLoading.set(false);
                },
                error: () => this.isLoading.set(false)
            });
        } else if (currentUser.role?.toLowerCase() === 'craftsman') {
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
        const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
        const title = notification.title?.toLowerCase() || '';

        // Convert numeric type to string enum for comparison
        const notificationTypeEnum = typeof notification.type === 'number'
            ? this.mapNumericTypeToEnum(notification.type)
            : notification.type;

        // 0. Admin - Withdrawal Requested (navigate to craftsman wallet)
        if (isAdmin && notificationTypeEnum === NotificationType.WithdrawalRequested) {
            const craftsmanId = notification.craftsManId;
            if (craftsmanId) {
                this.router.navigate(['/craftsman-wallet', craftsmanId]);
            } else {
                Swal.fire({
                    ...getSwalThemeConfig(this.themeService.isDark()),
                    icon: 'error',
                    title: 'Cannot View Wallet',
                    text: 'Craftsman information is missing from this notification.'
                });
            }
            return;
        }

        // 0.5. Fallback: Check if message contains "withdrawal" (temporary fix for backend issue)
        const message = notification.message?.toLowerCase() || '';
        if (isAdmin && (message.includes('withdrawal') || message.includes('withdraw'))) {
            const craftsmanId = notification.craftsManId;
            if (craftsmanId) {
                this.router.navigate(['/craftsman-wallet', craftsmanId]);
            }
            return;
        }

        // 1. Craftsman Accepted - Client side (redirect to payment)
        if (isClient && title.includes('craftsman accepted')) {
            if (notification.serviceRequestId) {
                this.router.navigate(['/payment', notification.serviceRequestId]);
            }
            return;
        }

        // 2. New Offer - Client side
        if (notificationTypeEnum === NotificationType.NewOfferFromCraftsman) {
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
                title: this.translateService.instant('NOTIFICATIONS.ALERTS.OFFER_REJECTED_TITLE'),
                text: notification.message || this.translateService.instant('NOTIFICATIONS.ALERTS.OFFER_REJECTED_TEXT')
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

        // Fallback: Check if message contains "withdrawal" (temporary fix for backend issue)
        const message = notification.message?.toLowerCase() || '';
        if (message.includes('withdrawal') || message.includes('withdraw')) {
            return 'NOTIFICATIONS.TYPE_WITHDRAWAL_REQUESTED';
        }

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
            default:
                console.log('No translation key found for type:', notification.type);
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
            9: NotificationType.ServiceRequestScheduled  // Service scheduled notification
        };
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
            default:
                return 'ℹ️';
        }
    }
}
