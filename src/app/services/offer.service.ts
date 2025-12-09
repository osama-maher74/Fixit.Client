import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ClientSelectCraftsmanDto {
    serviceRequestId: number;
    craftsmanId: number;
}

export interface CraftsmanAcceptDto {
    serviceRequestId: number;
}

export interface CraftsmanRejectDto {
    serviceRequestId: number;
}

export interface CraftsManNewOfferDto {
    serviceRequestId: number;
    craftsmanId: number;
    finalAmount: number;
    description: string;
}

export enum ClientDecision {
    Accept = 0,
    Reject = 1
}

export interface ClientRespondDto {
    offerId: number;
    decision: ClientDecision;
}

export interface OfferResponse {
    id: number;
    serviceRequestId: number;
    craftsManId: number;
    craftsManName?: string;
    amount: number;          // Backend uses "Amount" not "FinalAmount"
    finalAmount?: number;    // Alias for frontend compatibility
    description?: string;
    status?: string;
    createdAt?: string;
    suggestedPrice?: number;
}

@Injectable({
    providedIn: 'root'
})
export class OfferService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/Offer`;

    /**
     * Client selects a craftsman for their service request
     * POST /api/Offer/select-craftsman
     */
    selectCraftsman(dto: ClientSelectCraftsmanDto): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/select-craftsman`, dto);
    }

    /**
     * Craftsman accepts a service request offer
     * POST /api/Offer/craftsman-accept
     */
    craftsmanAccept(dto: CraftsmanAcceptDto): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/craftsman-accept`, dto);
    }

    /**
     * Craftsman rejects a service request offer
     * POST /api/Offer/craftsman-reject
     */
    craftsmanReject(dto: CraftsmanRejectDto): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/craftsman-reject`, dto);
    }

    /**
     * Craftsman submits a new offer with custom price
     * POST /api/Offer/craftsman-new-offer
     */
    craftsmanNewOffer(dto: CraftsManNewOfferDto): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/craftsman-new-offer`, dto);
    }

    /**
     * Client responds to a craftsman's offer
     * POST /api/Offer/client-respond
     */
    clientRespond(dto: ClientRespondDto): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/client-respond`, dto);
    }

    /**
     * Craftsman apologizes and cancels an InProgress service request
     * POST /api/Offer/craftsman-apologize
     */
    craftsmanApologize(dto: CraftsmanApologizeDto): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/craftsman-apologize`, dto);
    }

    /**
     * Client chooses to get a refund after craftsman apologizes
     * POST /api/Offer/client-choose-refund
     */
    clientChooseRefund(dto: ClientChooseAfterApologyDto): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/client-choose-refund`, dto);
    }

    /**
     * Client chooses to select a new craftsman after craftsman apologizes
     * POST /api/Offer/client-choose-new-craftsman
     */
    clientChooseNewCraftsman(dto: ClientChooseAfterApologyDto): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/client-choose-new-craftsman`, dto);
    }
}

export interface CraftsmanApologizeDto {
    serviceRequestId: number;
    reason?: string;
}

export interface ClientChooseAfterApologyDto {
    serviceRequestId: number;

    /**
     * Get offer by ID
     * GET /api/Offer/GetById/{id}
     */
    getOfferById(id: number): Observable<OfferResponse> {
        return this.http.get<OfferResponse>(`${this.API_URL}/GetById/${id}`);
    }
}
