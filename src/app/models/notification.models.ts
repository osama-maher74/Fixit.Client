export enum NotificationType {
    SelectCraftsman = 'SelectCraftsman',
    CraftsmanAccepted = 'CraftsmanAccepted',
    CraftsmanRejected = 'CraftsmanRejected',
    NewOfferFromCraftsman = 'NewOfferFromCraftsman',
    ClientAcceptedOffer = 'ClientAcceptedOffer',
    ClientRejectedOffer = 'ClientRejectedOffer',
    PaymentRequested = 'PaymentRequested'
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
    clientName?: string; // Added to match backend
}

export interface CreateNotificationDto {
    serviceRequestId: number;
    message: string;
    type: NotificationType;
    recipientType: 'Client' | 'Craftsman';
}
