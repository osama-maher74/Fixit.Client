import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interface for creating a service request
 */
export interface CreateServiceRequestDto {
    clientId: number;
    serviceId: number;
    description: string;
    serviceStartTime: string; // ISO string
    location?: string;
    suggestedPrice?: number;
    serviceRequestImage?: File;
}

/**
 * Interface for service request response
 */
export interface ServiceRequestResponse {
    id: number;
    clientId: number;
    serviceId: number;
    description: string;
    serviceStartTime: string;
    location?: string;
    suggestedPrice?: number;
    status: string;
    createdAt: string;
    imageUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ServiceRequestService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/ServiceRequest`;

    /**
     * Create a new service request
     * POST /api/ServiceRequest
     * @param serviceRequest - The service request data
     * @returns Observable of the created service request
     */
    createServiceRequest(serviceRequest: CreateServiceRequestDto): Observable<ServiceRequestResponse> {
        const formData = this.prepareFormData(serviceRequest);

        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        return this.http.post<ServiceRequestResponse>(this.API_URL, formData);
    }

    /**
     * Get all service requests for the current user
     * GET /api/ServiceRequest
     */
    getMyServiceRequests(): Observable<ServiceRequestResponse[]> {
        return this.http.get<ServiceRequestResponse[]>(this.API_URL);
    }

    /**
     * Get a specific service request by ID
     * GET /api/ServiceRequest/{id}
     */
    getServiceRequestById(id: number): Observable<ServiceRequestResponse> {
        return this.http.get<ServiceRequestResponse>(`${this.API_URL}/${id}`);
    }

    /**
     * Cancel a service request
     * DELETE /api/ServiceRequest/{id}
     */
    cancelServiceRequest(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }

    /**
     * Helper method to prepare FormData from service request DTO
     */
    private prepareFormData(serviceRequest: CreateServiceRequestDto): FormData {
        const formData = new FormData();

        // Required fields
        formData.append('ClientId', serviceRequest.clientId.toString());
        formData.append('ServiceId', serviceRequest.serviceId.toString());
        formData.append('Description', serviceRequest.description);
        formData.append('ServiceStartTime', serviceRequest.serviceStartTime);

        // Optional fields
        if (serviceRequest.location) {
            formData.append('Location', serviceRequest.location);
        }

        if (serviceRequest.suggestedPrice !== undefined && serviceRequest.suggestedPrice !== null) {
            formData.append('SuggestedPrice', serviceRequest.suggestedPrice.toString());
        }

        // Image upload
        if (serviceRequest.serviceRequestImage) {
            formData.append('ServiceRequestImage', serviceRequest.serviceRequestImage, serviceRequest.serviceRequestImage.name);
        }

        return formData;
    }
}
