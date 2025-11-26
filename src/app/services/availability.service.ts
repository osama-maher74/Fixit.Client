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
    getAvailabilityByDay(craftsmanId: number, dayOfWeek: number): Observable<AvailabilityDto[]> {
        const url = `${this.AVAILABILITY_API}/craftsman/${craftsmanId}/day/${dayOfWeek}`;
        console.log('AvailabilityService - Getting availability for day:', dayOfWeek);
        return this.http.get<AvailabilityDto[]>(url);
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
     * Get available time slots for a specific date and duration
     * GET /api/Availability/slots?craftsmanId={id}&date=YYYY-MM-DD&duration=60
     */
    getTimeSlots(
        craftsmanId: number,
        dateIso: string,
        durationMinutes: number
    ): Observable<TimeSlotDto[]> {
        const url = `${this.AVAILABILITY_API}/slots`;
        const params = new HttpParams()
            .set('craftsmanId', craftsmanId.toString())
            .set('date', dateIso)
            .set('duration', durationMinutes.toString());

        console.log('AvailabilityService - Getting time slots:', { url, craftsmanId, dateIso, durationMinutes });
        return this.http.get<ApiResponse<TimeSlotDto[]>>(url, { params }).pipe(
            map(response => response.data)
        );
    }

    /**
     * Create a time-off entry
     * POST /api/timeoff
     */
    createTimeOff(dto: CreateTimeOffDto): Observable<TimeOffDto> {
        console.log('AvailabilityService - Creating time-off:', dto);
        return this.http.post<TimeOffDto>(this.TIMEOFF_API, dto);
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
