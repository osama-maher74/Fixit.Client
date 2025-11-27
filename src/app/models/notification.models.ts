export enum NotificationType {
    SelectCraftsman = 'SelectCraftsman',
    CraftsmanAccepted = 'CraftsmanAccepted',
    CraftsmanRejected = 'CraftsmanRejected',
    PriceRejectedByCraftsman = 'PriceRejectedByCraftsman',
    NewPriceOfferedByCraftsman = 'NewPriceOfferedByCraftsman',
    ClientAcceptedCraftsmanPrice = 'ClientAcceptedCraftsmanPrice',
    ClientRejectedCraftsmanPrice = 'ClientRejectedCraftsmanPrice',
    PaymentCompleted = 'PaymentCompleted',
    ServiceCompleted = 'ServiceCompleted'
}

export interface ReadNotificationDto {
    id: number;
    serviceRequestId: number;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: string; // ISO Date string
}

export interface CreateNotificationDto {
    serviceRequestId: number;
    message: string;
    type: NotificationType;
    recipientType: 'Client' | 'Craftsman';
}
