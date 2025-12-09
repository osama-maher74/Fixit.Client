export enum NotificationType {
    SelectCraftsman = 'SelectCraftsman',
    CraftsmanAccepted = 'CraftsmanAccepted',
    CraftsmanRejected = 'CraftsmanRejected',
    NewOfferFromCraftsman = 'NewOfferFromCraftsman',
    ClientAcceptedOffer = 'ClientAcceptedOffer',
    ClientRejectedOffer = 'ClientRejectedOffer',
    PaymentRequested = 'PaymentRequested',
    ServiceRequestScheduled = 'ServiceRequestScheduled',
    WithdrawalRequested = 'WithdrawalRequested',
    WithdrawalApproved = 'WithdrawalApproved',
    CraftsmanApologized = 'CraftsmanApologized',
    ServiceCancelled = 'ServiceCancelled',
    CraftsmanNoShow = 'CraftsmanNoShow'
}

export interface ReadNotificationDto {
    id: number;
    serviceRequestId: number;
    title: string; // Added to match backend
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: string; // ISO Date string
    // Offer details for NewPriceOfferedByCraftsman notifications
    offerId?: number | null;
    finalAmount?: number | null;
    description?: string | null;
    craftsmanName?: string;
    craftsManName?: string; // Backend uses this capitalization
    craftsManId?: number; // Craftsman ID for admin notifications
    clientName?: string; // Added to match backend
    clientId?: number; // Client ID for notifications
}

export interface CreateNotificationDto {
    serviceRequestId: number;
    message: string;
    type: NotificationType;
    recipientType: 'Client' | 'Craftsman' | 'Admin';
    title?: string;
    finalAmount?: number;
    description?: string;
    craftsManId?: number;
    clientId?: number;
}
