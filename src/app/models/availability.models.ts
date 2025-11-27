// Availability Models for Craftsman Scheduling

export interface AvailabilityDto {
    id: number;
    craftsManId?: number;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    dayName?: string; // From backend: "Monday", "Tuesday", etc.
    startTime: string; // From backend: "09:00:00" format (with seconds)
    endTime: string; // From backend: "21:39:00" format (with seconds)
    isAvailable: boolean;
    startTimeFormatted?: string; // From backend: "09:00" (without seconds)
    endTimeFormatted?: string; // From backend: "21:39" (without seconds)
}

// DTO for creating new availability
export interface CreateAvailabilityDto {
    craftsManId: number;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    startTime: string; // Format: "HH:mm" (24-hour) - backend accepts with or without seconds
    endTime: string;   // Format: "HH:mm" (24-hour)
    isAvailable: boolean;
}

// DTO for updating availability
export interface UpdateAvailabilityDto {
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    isAvailable?: boolean;
}

// Backend response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface TimeSlotDto {
    time: string; // "09:00" format
    startTime: string; // ISO 8601 format
    endTime?: string; // ISO 8601 format
    isAvailable: boolean;
}

export interface TimeOffDto {
    id: number;
    craftsManId: number;
    startDateTime: string; // ISO 8601
    endDateTime: string; // ISO 8601
    reason?: string;
}

export interface CreateTimeOffDto {
    craftsManId: number;
    StartDate: string; // ISO 8601 format - capital S to match backend
    EndDate: string; // ISO 8601 format - capital E to match backend
    reason?: string;
}

// Week day view for appointment scheduling
export interface WeekDayView {
    date: Date;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    dayName: string; // "Sun", "Mon", "Tue", etc.
    fullDayName: string; // "Sunday", "Monday", etc.
    dateString: string; // "26"
    isToday: boolean;
    isAvailable: boolean;
    availabilityData?: AvailabilityDto;
}

// Helper constants
export const DAYS_OF_WEEK = [
    { value: 0, name: 'Sunday', short: 'Sun' },
    { value: 1, name: 'Monday', short: 'Mon' },
    { value: 2, name: 'Tuesday', short: 'Tue' },
    { value: 3, name: 'Wednesday', short: 'Wed' },
    { value: 4, name: 'Thursday', short: 'Thu' },
    { value: 5, name: 'Friday', short: 'Fri' },
    { value: 6, name: 'Saturday', short: 'Sat' }
];

// Utility function to get day name
export function getDayName(dayOfWeek: number): string {
    const day = DAYS_OF_WEEK.find(d => d.value === dayOfWeek);
    return day ? day.name : 'Unknown';
}

// Utility function to format time from 24h to 12h format
export function formatTime12Hour(time24: string): string {
    // Handle both HH:mm and HH:mm:ss formats
    const timeParts = time24.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}
