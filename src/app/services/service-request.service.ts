import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CreateServiceRequestDto {
    clientId: number;
    serviceId: number;
    description: string;
    location?: string;
    suggestedPrice?: number;
    serviceRequestImage?: File;
}

export interface ServiceRequestResponse {
    id?: number;
    servicesRequestId?: number; // New property from backend
    craftsManId?: number; // Craftsman assigned to this request
    craftsManName?: string; // Craftsman name if assigned
    clientId?: number;
    clientName?: string;
    serviceId?: number;
    serviceName?: string;
    description?: string;
    serviceStartTime?: string;
    location?: string;
    suggestedPrice?: number;
    totalAmount?: number;
    status?: string;
    createdAt?: string;
    requestAt?: string;
    completedAt?: string;
    imageUrl?: string;
    serviceRequestImage?: string;
    waitingForClientPaymentAt?: string;
    isCancelled?: boolean;
    reviewRatingValue?: number;
    reviewComment?: string;
    reviewId?: number; // ID of the review if it exists
    clientSecret?: string;
}

export interface ConfirmStartAtTimeDto {
    serviceId: number;
    clientId: number;
    craftsManId: number;
    serviceStartTime: string; // ISO 8601 format
}

export interface CancelServiceRequestDto {
    reason: string;
    reasonType: 'craftsman_no_show' | 'cancel_request';
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ServiceRequestService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/ServiceRequest`;

    createServiceRequest(serviceRequest: CreateServiceRequestDto): Observable<ServiceRequestResponse> {
        const formData = this.prepareFormData(serviceRequest);

        // Use responseType: 'text' to handle backend responses that might not be JSON
        return this.http.post(this.API_URL, formData, { responseType: 'text' }).pipe(
            map((response: string) => {
                console.log('Raw createServiceRequest response:', response);
                // Try to parse as JSON
                try {
                    const parsed = JSON.parse(response);
                    console.log('Parsed createServiceRequest response:', parsed);

                    // Handle both PascalCase (C# default) and camelCase
                    const result = {
                        ...parsed,
                        servicesRequestId: parsed.servicesRequestId || parsed.ServicesRequestId || parsed.id
                    } as ServiceRequestResponse;

                    console.log('Mapped ServiceRequestResponse:', result);
                    return result;
                } catch (e) {
                    console.error('Error parsing createServiceRequest response:', e);
                    // If not JSON, return minimal success response
                    return { status: 'Created' } as ServiceRequestResponse;
                }
            })
        );
    }

    getMyServiceRequests(): Observable<ServiceRequestResponse[]> {
        return this.http.get<ServiceRequestResponse[]>(this.API_URL);
    }

    getServiceRequestById(id: number): Observable<ServiceRequestResponse> {
        return this.http.get<ServiceRequestResponse>(`${this.API_URL}/${id}`);
    }

    /**
     * Get all service requests for a specific client by client ID
     * GET /api/ServiceRequest/Client/ById/{clientId}
     */
    getAllServiceRequestsForClientById(clientId: number): Observable<ServiceRequestResponse[]> {
        return this.http.get<ServiceRequestResponse[]>(`${this.API_URL}/Client/ById/${clientId}`);
    }

    /**
     * Get all service requests for a specific craftsman by craftsman ID
     * GET /api/ServiceRequest/Craftsman/ById/{craftsManId}
     */
    getAllServiceRequestsForCraftsmanById(craftsManId: number): Observable<ServiceRequestResponse[]> {
        return this.http.get<ServiceRequestResponse[]>(`${this.API_URL}/Craftsman/ById/${craftsManId}`);
    }

    cancelServiceRequest(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }

    /**
     * Get all service requests (Admin only)
     * GET /api/ServiceRequest
     */
    getAllServiceRequests(): Observable<ServiceRequestResponse[]> {
        return this.http.get<ServiceRequestResponse[]>(this.API_URL);
    }

    /**
     * Get all available service request statuses
     * GET /api/ServiceRequest/statuses
     */
    getServiceRequestStatuses(): Observable<string[]> {
        return this.http.get<string[]>(`${this.API_URL}/statuses`);
    }

    /**
     * Get requests by client and status
     * GET /api/ServiceRequest/by-client-status?clientId=...&status=...
     */
    getRequestsByClientAndStatus(clientId: number, status: string): Observable<ServiceRequestResponse[]> {
        return this.http.get<ServiceRequestResponse[]>(`${this.API_URL}/by-client-status`, {
            params: { clientId: clientId.toString(), status: status }
        });
    }

    /**
     * Get requests by craftsman and status
     * GET /api/ServiceRequest/by-craftsMan-status?craftsManId=...&status=...
     */
    getRequestsByCraftsmanAndStatus(craftsManId: number, status: string): Observable<ServiceRequestResponse[]> {
        return this.http.get<ServiceRequestResponse[]>(`${this.API_URL}/by-craftsMan-status`, {
            params: { craftsManId: craftsManId.toString(), status: status }
        });
    }

    /**
     * Update service request start time
     * PUT /api/ServiceRequest/StartAtTime/{id}
     */
    updateServiceRequestStartTime(serviceRequestId: number, data: ConfirmStartAtTimeDto): Observable<string> {
        return this.http.put(
            `${this.API_URL}/StartAtTime/${serviceRequestId}`,
            data,
            { responseType: 'text' }
        );
    }

    /**
     * Complete service request
     * POST /api/ServiceRequest/complete/{requestId}
     */
    completeServiceRequest(requestId: number): Observable<string> {
        return this.http.post(
            `${this.API_URL}/complete/${requestId}`,
            {},
            { responseType: 'text' }
        );
    }

    /**
     * Cancel service request with reason (updates status to Cancelled and sends notifications)
     * POST /api/ServiceRequest/cancel/{requestId}
     */
    cancelServiceRequestWithReason(requestId: number, data: CancelServiceRequestDto): Observable<string> {
        return this.http.post(
            `${this.API_URL}/cancel/${requestId}`,
            data,
            { responseType: 'text' }
        );
    }

    private prepareFormData(serviceRequest: CreateServiceRequestDto): FormData {
        const formData = new FormData();

        formData.append('ClientId', serviceRequest.clientId.toString());
        formData.append('ServiceId', serviceRequest.serviceId.toString());
        formData.append('Description', serviceRequest.description);

        if (serviceRequest.location) {
            formData.append('Location', serviceRequest.location);
        }

        if (serviceRequest.suggestedPrice !== undefined && serviceRequest.suggestedPrice !== null) {
            formData.append('SuggestedPrice', serviceRequest.suggestedPrice.toString());
        }

        if (serviceRequest.serviceRequestImage) {
            formData.append('ServiceRequestImage', serviceRequest.serviceRequestImage, serviceRequest.serviceRequestImage.name);
        }

        return formData;
    }
}
