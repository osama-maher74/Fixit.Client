import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AvailabilityDto, TimeSlotDto, AvailabilityApiResponse } from '../models/availability.models';

@Injectable({
    providedIn: 'root'
})
export class AvailabilityService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/Availability`;

    /**
     * Get craftsman's weekly schedule (all 7 days)
     * GET /api/availability/craftsman/{craftsmanId}
     */
    getWeeklySchedule(craftsmanId: number): Observable<AvailabilityDto[]> {
        return this.http.get<AvailabilityApiResponse>(`${this.API_URL}/craftsman/${craftsmanId}`)
            .pipe(
                map(response => response.data as AvailabilityDto[])
            );
    }

    /**
     * Get available time slots for a specific date and duration
     * GET /api/availability/slots?craftsmanId={id}&date={date}&duration={minutes}
     */
    getAvailableSlots(craftsmanId: number, date: string, duration: number = 60): Observable<TimeSlotDto[]> {
        const params = new HttpParams()
            .set('craftsmanId', craftsmanId.toString())
            .set('date', date)
            .set('duration', duration.toString());

       return this.http.get<AvailabilityApiResponse>(`${this.API_URL}/slots`, { params })
            .pipe(
                map(response => response.data as TimeSlotDto[])
            );
    }

    /**
     * Check if craftsman is available on a specific day of week
     * GET /api/availability/check-availability/{craftsmanId}/{dayOfWeek}
     */
    checkAvailability(craftsmanId: number, dayOfWeek: number): Observable<boolean> {
        return this.http.get<any>(`${this.API_URL}/check-availability/${craftsmanId}/${dayOfWeek}`)
            .pipe(
                map(response => response.data?.isAvailable || false)
            );
    }
}
