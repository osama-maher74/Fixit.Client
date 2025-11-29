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
    private readonly TIMESLOTS_API = `${environment.apiUrl}/TimeSlots`;
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
     * GET /api/TimeSlots/available?craftsmanId={id}&date={date}
     */
    getTimeSlots(craftsmanId: number, date: Date): Observable<TimeSlotDto[]> {
        // Format date as yyyy-MM-dd
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const url = `${this.TIMESLOTS_API}/available?craftsmanId=${craftsmanId}&date=${dateString}`;
        console.log('AvailabilityService - Getting time slots URL:', url);

        return this.http.get<TimeSlotDto[]>(url);
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
