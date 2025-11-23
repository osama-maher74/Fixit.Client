import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ServiceCard } from '../components/service-card/service-card.component';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/Service`;

  /**
   * Get all available services
   * GET /api/Service
   */
  getAllServices(): Observable<ServiceCard[]> {
    return this.http.get<ServiceCard[]>(this.API_URL);
  }

  /**
   * Get a specific service by name
   * GET /api/Service/{serviceName}
   */
  getServiceByName(serviceName: string): Observable<ServiceCard> {
    return this.http.get<ServiceCard>(`${this.API_URL}/${serviceName}`);
  }
}
