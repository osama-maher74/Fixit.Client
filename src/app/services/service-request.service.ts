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
    clientId?: number;
    serviceId?: number;
    description?: string;
    serviceStartTime?: string;
    location?: string;
    suggestedPrice?: number;
    status?: string;
    createdAt?: string;
    imageUrl?: string;
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
                // Try to parse as JSON
                try {
                    return JSON.parse(response) as ServiceRequestResponse;
                } catch {
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

    cancelServiceRequest(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
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
