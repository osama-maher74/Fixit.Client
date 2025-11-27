import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
    AvailabilityDto,
    CreateAvailabilityDto,
    UpdateAvailabilityDto,
    TimeSlotDto,
    TimeOffDto,
    CreateTimeOffDto,
    ApiResponse
} from '../models/availability.models';

@Injectable({
    providedIn: 'root'
})
export class AvailabilityService {
    private http = inject(HttpClient);
    private readonly AVAILABILITY_API = `${environment.apiUrl}/availability`;
    private readonly TIMEOFF_API = `${environment.apiUrl}/timeoff`;

    /**
     * Get all availability entries for a craftsman
     * GET /api/availability/craftsman/{id}
     */
    getCraftsmanAvailability(craftsmanId: number): Observable<AvailabilityDto[]> {
        const url = `${this.AVAILABILITY_API}/craftsman/${craftsmanId}`;
        console.log('AvailabilityService - Getting craftsman availability:', url);
        return this.http.get<ApiResponse<AvailabilityDto[]>>(url).pipe(
            map(response => response.data)
        );
    }

    /**
     * Get availability for a specific day of the week
     * GET /api/availability/craftsman/{id}/day/{day}
     */
    getAvailabilityByDay(craftsmanId: number, dayOfWeek: number): Observable<AvailabilityDto> {
        const url = `${this.AVAILABILITY_API}/craftsman/${craftsmanId}/day/${dayOfWeek}`;
        console.log('AvailabilityService - Getting availability for day:', dayOfWeek);
        return this.http.get<ApiResponse<AvailabilityDto>>(url).pipe(
            map(response => response.data)
        );
    }

    /**
     * Get available time slots for a craftsman on a specific date
     * GET /api/Availability/slots?craftsmanId={id}&date={date}&duration={duration}
     */
    getTimeSlots(craftsmanId: number, date: Date, duration: number): Observable<TimeSlotDto[]> {
        // Ensure date is a Date object and format to ISO string
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const dateString = dateObj.toISOString();

        const url = `${this.AVAILABILITY_API}/slots?craftsmanId=${craftsmanId}&date=${encodeURIComponent(dateString)}&duration=${duration}`;
        console.log('AvailabilityService - Getting time slots URL:', url);

        return this.http.get<ApiResponse<TimeSlotDto[]>>(url).pipe(
            map(response => response.data)
        );
    }

    /**
     * Create a new availability entry
     * POST /api/availability
     */
    createAvailability(dto: CreateAvailabilityDto): Observable<AvailabilityDto> {
        console.log('AvailabilityService - Creating availability:', dto);
        return this.http.post<ApiResponse<AvailabilityDto>>(this.AVAILABILITY_API, dto).pipe(
            map(response => response.data)
        );
    }

    /**
     * Update an existing availability entry
     * PUT /api/availability/{id}
     */
    updateAvailability(id: number, dto: UpdateAvailabilityDto): Observable<AvailabilityDto> {
        const url = `${this.AVAILABILITY_API}/${id}`;
        console.log('AvailabilityService - Updating availability:', id, dto);
        return this.http.put<AvailabilityDto>(url, dto);
    }

    /**
     * Delete an availability entry
     * DELETE /api/availability/{id}
     */
    deleteAvailability(id: number): Observable<void> {
        const url = `${this.AVAILABILITY_API}/${id}`;
        console.log('AvailabilityService - Deleting availability:', id);
        return this.http.delete<void>(url);
    }

    /**
     * Get all time-off entries for a craftsman
     * GET /api/timeoff/craftsman/{id}
     */
    getCraftsmanTimeOff(craftsmanId: number): Observable<TimeOffDto[]> {
        const url = `${this.TIMEOFF_API}/craftsman/${craftsmanId}`;
        console.log('AvailabilityService - Getting craftsman time-off:', url);
        return this.http.get<TimeOffDto[]>(url);
    }

    /**
     * Delete a time-off entry
     * DELETE /api/timeoff/{id}
     */
    deleteTimeOff(id: number): Observable<void> {
        const url = `${this.TIMEOFF_API}/${id}`;
        console.log('AvailabilityService - Deleting time-off:', id);
        return this.http.delete<void>(url);
    }
}
