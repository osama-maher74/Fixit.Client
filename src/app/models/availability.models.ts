export interface AvailabilityDto {
    id: number;
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    startTimeFormatted: string;
    endTimeFormatted: string;
    isAvailable: boolean;
}

export interface TimeSlotDto {
    time: string;
    isAvailable: boolean;
    startTime: string;
}

export interface AvailabilityApiResponse {
    success: boolean;
    data: AvailabilityDto[] | TimeSlotDto[];
    message: string;
}
