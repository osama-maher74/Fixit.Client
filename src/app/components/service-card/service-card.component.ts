import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

export interface ServiceCard {
  serviceId: number; // Service ID from database (matches API response)
  serviceName: string;
  initialPrice: number;
  displayDurationMinutes: number;
  description?: string;
  tagline?: string;
  features?: string[];
  images?: string[];
}

// Map service names to image URLs
const SERVICE_IMAGES: { [key: string]: string } = {
  'Plumbing Repair': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=500&q=80',
  'Electrical Maintenance': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80',
  'AC Cleaning & Service': '/assets/ac.jpeg',
  'Home Deep Cleaning': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=500&q=80',
  'Carpentry & Assembly': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=500&q=80',
  'Painting': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80',
  'Locksmith': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=500&q=80',
  'default': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'
};

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss'
})
export class ServiceCardComponent {
  @Input() service!: ServiceCard;

  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  /**
   * Get image URL for the service
   */
  getServiceImage(): string {
    return SERVICE_IMAGES[this.service.serviceName] || SERVICE_IMAGES['default'];
  }

  /**
   * Get translated service name
   */
  getTranslatedServiceName(): string {
    const translationKey = `SERVICES.SERVICE_NAMES.${this.service.serviceName}`;
    const translated = this.translate.instant(translationKey);
    // If translation not found, return original name
    return translated !== translationKey ? translated : this.service.serviceName;
  }

  /**
   * Format duration to readable string (e.g., "2 hours")
   */
  getFormattedDuration(): string {
    const hours = Math.floor(this.service.displayDurationMinutes / 60);
    const minutes = this.service.displayDurationMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      const hourLabel = hours === 1 ? this.translate.instant('SERVICE_BOOKING.HOUR') : this.translate.instant('SERVICE_BOOKING.HOURS');
      return `${hours} ${hourLabel}`;
    } else {
      return `${minutes} ${this.translate.instant('SERVICE_BOOKING.MIN')}`;
    }
  }

  /**
   * Handle "Book Now" button click
   * Redirect to login if not authenticated, otherwise proceed with booking
   */
  handleBookNow(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else {
      // Navigate to the booking page with service name and ID
      this.router.navigate(['/service-booking'], {
        queryParams: {
          service: this.service.serviceName,
          serviceId: this.service.serviceId
        }
      });
    }
  }

}
