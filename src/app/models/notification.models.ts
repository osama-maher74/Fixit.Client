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
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: string; // ISO Date string
    // Offer details for NewPriceOfferedByCraftsman notifications
    offerId?: number;
    finalAmount?: number;
    description?: string;
    craftsmanName?: string;
}

export interface CreateNotificationDto {
    serviceRequestId: number;
    message: string;
    type: NotificationType;
    recipientType: 'Client' | 'Craftsman';
}
