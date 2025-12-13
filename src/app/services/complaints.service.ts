import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface CreateComplaintDTO {
    serviceRequestId: number;
    clientId: number;
    craftsManId: number;
    content: string;
}

export interface ComplaintDTO {
    id: number;
    serviceRequestId: number;
    clientId: number;
    craftsManId: number;
    content: string;
    status: string;
    createdAt: string;
    adminResponse?: string;
    respondedAt?: string;
}

export interface RespondToComplaintDTO {
    complaintId: number;
    adminResponse: string;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class ComplaintsService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    createComplaint(complaint: CreateComplaintDTO, isCraftsman: boolean = false): Observable<any> {
        const endpoint = isCraftsman ? '/complaints/craftsman/create' : '/complaints/client/create';
        return this.http.post(`${this.apiUrl}${endpoint}`, complaint);
    }

    getComplaintsByServiceRequest(serviceRequestId: number, userId: number, isCraftsman: boolean = false): Observable<ComplaintDTO[]> {
        const endpoint = isCraftsman
            ? `/complaints/craftsman/${userId}/service-request/${serviceRequestId}`
            : `/complaints/client/${userId}/service-request/${serviceRequestId}`;
        return this.http.get<ComplaintDTO[]>(`${this.apiUrl}${endpoint}`);
    }

    getAllComplaints(): Observable<ComplaintDTO[]> {
        return this.http.get<ComplaintDTO[]>(`${this.apiUrl}/complaints/all`);
    }

    respondToComplaint(response: RespondToComplaintDTO): Observable<any> {
        return this.http.post(`${this.apiUrl}/complaints/respond`, response);
    }

    updateComplaintStatus(complaintId: number, status: string): Observable<any> {
        const payload = { complaintId, status };
        return this.http.post(`${this.apiUrl}/complaints/admin/update-status`, payload);
    }
}
