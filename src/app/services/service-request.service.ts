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
    clientSecret?: string;
}

export interface ConfirmStartAtTimeDto {
    serviceId: number;
    clientId: number;
    craftsManId: number;
    serviceStartTime: string; // ISO 8601 format
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

    cancelServiceRequest(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
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
