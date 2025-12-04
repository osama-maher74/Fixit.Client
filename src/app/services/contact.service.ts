import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContactFormDto } from '../models/contact.models';

@Injectable({
    providedIn: 'root'
})
export class ContactService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Contact`;

    /**
     * Send contact form data to the backend
     * @param contactData The contact form data
     */
    sendContactMessage(contactData: ContactFormDto): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/send`, contactData);
    }
}
