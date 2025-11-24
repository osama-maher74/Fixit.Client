import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-booking',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './service-booking.html',
  styleUrl: './service-booking.scss'
})
export class ServiceBookingComponent {
  constructor(private router: Router) { }

  onBookNow(): void {
    // TODO: Implement booking flow in the future
    alert('Booking feature coming soon! This will be implemented in the future to start the service booking process.');
    console.log('Book Now clicked - Future implementation');
    // Example: this.router.navigate(['/booking-flow']);
  }
}
