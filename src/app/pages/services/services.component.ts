import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceCardComponent, ServiceCard } from '../../components/service-card/service-card.component';
import { ServiceService } from '../../services/service.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit {
  private serviceService = inject(ServiceService);

  // Signals for reactive state
  services = signal<ServiceCard[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadServices();
  }

  /**
   * Load services from API
   */
  private loadServices(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.serviceService.getAllServices().subscribe({
      next: (data: ServiceCard[]) => {
        this.services.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading services:', error);
        this.errorMessage.set(error.error?.message || 'Failed to load services');
        this.isLoading.set(false);

        // Fallback to demo data for development
        this.loadDemoData();
      }
    });
  }

  /**
   * Load demo data (fallback for development)
   */
  private loadDemoData(): void {
    // this.services.set([
    //   {
    //     serviceName: 'Plumbing Repair',
    //     initialPrice: 50,
    //     displayDurationMinutes: 120
    //   },
    //   {
    //     serviceName: 'Electrical Maintenance',
    //     initialPrice: 75,
    //     displayDurationMinutes: 120
    //   },
    //   {
    //     serviceName: 'AC Cleaning & Service',
    //     initialPrice: 120,
    //     displayDurationMinutes: 120
    //   },
    //   {
    //     serviceName: 'Home Deep Cleaning',
    //     initialPrice: 100,
    //     displayDurationMinutes: 120
    //   },
    //   {
    //     serviceName: 'Carpentry & Assembly',
    //     initialPrice: 60,
    //     displayDurationMinutes: 120
    //   }
    // ]);
  }

  /**
   * Retry loading services
   */
  retryLoad(): void {
    this.loadServices();
  }
}
