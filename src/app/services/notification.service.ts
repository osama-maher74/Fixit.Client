import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { CreateNotificationDto, ReadNotificationDto } from '../models/notification.models';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
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
        // Sort by date DESC
        const sorted = notifications.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.notifications.set(sorted);
        this.updateUnreadCount();
    }

    private updateUnreadCount() {
        const count = this.notifications().filter(n => !n.isRead).length;
        this.unreadCount.set(count);
    }

    markLocalAsRead(id: number) {
        this.notifications.update(current =>
            current.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this.updateUnreadCount();
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
            .withUrl(hubUrl)
            .withAutomaticReconnect()
            .build();

        this.hubConnection.start()
            .then(() => console.log('SignalR Connected'))
            .catch(err => console.error('Error while starting SignalR connection: ' + err));

        this.hubConnection.on('NotificationReceived', (notification: ReadNotificationDto) => {
            console.log('Real-time notification received:', notification);
            this.notificationReceivedSubject.next(notification);
            this.addRealTimeNotification(notification);
        });
    }
}
