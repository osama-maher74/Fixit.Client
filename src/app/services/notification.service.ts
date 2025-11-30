import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { CreateNotificationDto, ReadNotificationDto } from '../models/notification.models';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_URL = `${environment.apiUrl}/Notification`;
    private hubConnection: HubConnection | null = null;

    // Signal to hold current notifications for reactive UI updates
    notifications = signal<ReadNotificationDto[]>([]);
    unreadCount = signal<number>(0);

    // Subject to notify components of real-time events
    private notificationReceivedSubject = new Subject<ReadNotificationDto>();
    notificationReceived$ = this.notificationReceivedSubject.asObservable();

    constructor() {
        this.startSignalRConnection();
    }

    // --- API Methods ---

    getNotificationsForClient(clientId: number): Observable<ReadNotificationDto[]> {
        return this.http.get<ReadNotificationDto[]>(`${this.API_URL}/client/${clientId}`);
    }

    getNotificationsForCraftsman(craftsmanId: number): Observable<ReadNotificationDto[]> {
        return this.http.get<ReadNotificationDto[]>(`${this.API_URL}/craftsman/${craftsmanId}`);
    }

    createNotification(notification: CreateNotificationDto): Observable<ReadNotificationDto> {
        return this.http.post<ReadNotificationDto>(this.API_URL, notification);
    }

    markAsRead(id: number): Observable<void> {
        return this.http.put<void>(`${this.API_URL}/${id}/read`, {});
    }

    // --- State Management Helpers ---

    updateNotificationsList(notifications: ReadNotificationDto[]) {
        // Add unique IDs if missing (backend doesn't always provide id)
        const notificationsWithIds = notifications.map((n, index) => ({
            ...n,
            id: n.id || new Date(n.createdAt).getTime() + index // Use timestamp + index as fallback ID
        }));

        // Sort by date DESC
        const sorted = notificationsWithIds.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.notifications.set(sorted);
        this.updateUnreadCount();
    }

    private updateUnreadCount() {
        const unreadNotifications = this.notifications().filter(n => !n.isRead);
        const count = unreadNotifications.length;
        console.log('📊 Unread Count Update:');
        console.log('  - Total notifications:', this.notifications().length);
        console.log('  - Unread notifications:', count);
        console.log('  - Unread items (full objects):', unreadNotifications);
        console.log('  - All notifications with ID check:', this.notifications().map(n => ({
            id: n.id,
            hasId: !!n.id,
            title: n.title,
            isRead: n.isRead
        })));
        this.unreadCount.set(count);
    }

    markLocalAsRead(id: number) {
        console.log('🔄 markLocalAsRead called for notification:', id);
        const before = this.notifications().find(n => n.id === id);
        console.log('   Before update - isRead:', before?.isRead);

        this.notifications.update(current =>
            current.map(n => n.id === id ? { ...n, isRead: true } : n)
        );

        const after = this.notifications().find(n => n.id === id);
        console.log('   After update - isRead:', after?.isRead);
        console.log('   Unread count before:', this.unreadCount());

        this.updateUnreadCount();

        console.log('   Unread count after:', this.unreadCount());
    }

    addRealTimeNotification(notification: ReadNotificationDto) {
        this.notifications.update(current => [notification, ...current]);
        this.updateUnreadCount();
    }

    // --- SignalR Integration ---

    private startSignalRConnection() {
        // Assuming the hub URL is /notificationHub based on standard conventions
        // Adjust if your backend uses a different path
        const hubUrl = `${environment.apiUrl.replace('/api', '')}/notificationHub`;

        this.hubConnection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => this.authService.getToken() || ''
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection.start()
            .then(() => console.log('✅ SignalR Connected Successfully'))
            .catch((err: any) => console.error('❌ Error while starting SignalR connection:', err));

        this.hubConnection.on('NotificationReceived', (notification: ReadNotificationDto) => {
            console.log('🔔 Real-time notification received:', notification);
            this.notificationReceivedSubject.next(notification);
            this.addRealTimeNotification(notification);
        });

        // Handle reconnection events
        this.hubConnection.onreconnecting((error) => {
            console.log('⚠️ SignalR reconnecting...', error);
        });

        this.hubConnection.onreconnected((connectionId) => {
            console.log('✅ SignalR reconnected. Connection ID:', connectionId);
        });

        this.hubConnection.onclose((error) => {
            console.log('❌ SignalR connection closed', error);
        });
    }

    /**
     * Disconnect from SignalR hub (call on logout)
     */
    async disconnectSignalR(): Promise<void> {
        if (this.hubConnection) {
            try {
                await this.hubConnection.stop();
                console.log('✅ SignalR disconnected successfully');
            } catch (err) {
                console.error('❌ Error disconnecting SignalR:', err);
            }
        }
    }

    /**
     * Reconnect to SignalR hub (call on login)
     */
    async reconnectSignalR(): Promise<void> {
        await this.disconnectSignalR();
        this.startSignalRConnection();
    }

    /**
     * TEST ONLY: Simulate receiving a real-time notification
     * Call this from browser console to test UI updates without refresh
     * Example: notificationService.testRealTimeNotification()
     */
    testRealTimeNotification(): void {
        const testNotification: ReadNotificationDto = {
            id: Math.floor(Math.random() * 10000),
            serviceRequestId: 123,
            title: 'New Offer Received',
            message: 'This is a TEST notification to verify real-time updates work!',
            type: 'NewOfferFromCraftsman' as any,
            isRead: false,
            createdAt: new Date().toISOString(),
            offerId: 456,
            finalAmount: 250.00,
            description: 'Test offer description',
            craftsmanName: 'Test Craftsman'
        };

        console.log('🧪 Simulating real-time notification:', testNotification);
        this.addRealTimeNotification(testNotification);
        console.log('✅ Notification added! Check the bell icon - it should update WITHOUT refresh');
    }
}
