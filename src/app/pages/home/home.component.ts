import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ViewportScroller } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ServiceService } from '../../services/service.service';
import { ServiceCardComponent, ServiceCard } from '../../components/service-card/service-card.component';
import { ChatWidgetComponent } from '../../components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ServiceCardComponent, ChatWidgetComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  private serviceService = inject(ServiceService);
  private route = inject(ActivatedRoute);
  private viewportScroller = inject(ViewportScroller);

  // Signals for services
  services = signal<ServiceCard[]>([]);
  isLoadingServices = signal<boolean>(true);
  isCraftsman = signal<boolean>(false);

  ngOnInit(): void {
    this.loadServices();
    this.checkUserRole();
    this.handleFragmentScroll();
  }

  /**
   * Handle scroll to section based on URL fragment
   */
  private handleFragmentScroll(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        // Wait for the view to fully render before scrolling
        setTimeout(() => {
          const element = document.getElementById(fragment);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    });
  }

  /**
   * Check if current user is a craftsman
   */
  private checkUserRole(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.role) {
        // Case-insensitive comparison
        this.isCraftsman.set(user.role.toLowerCase() === 'craftsman');
        console.log('User role:', user.role, 'Is Craftsman:', this.isCraftsman());
      } else {
        this.isCraftsman.set(false);
      }
    });
  }

  /**
   * Load services from API (limited to first 4 for home page)
   */
  private loadServices(): void {
    this.isLoadingServices.set(true);

    this.serviceService.getAllServices().subscribe({
      next: (data: ServiceCard[]) => {
        // Show only first 4 services on home page
        this.services.set(data.slice(0, 4));
        this.isLoadingServices.set(false);
      },
      error: (error: any) => {
        console.error('Error loading services:', error);
        this.isLoadingServices.set(false);
        // Fallback to demo data
        this.loadDemoServices();
      }
    });
  }

  /**
   * Load demo services (fallback)
   */
  private loadDemoServices(): void {
    this.services.set([
      {
        serviceName: 'Plumbing Repair',
        initialPrice: 50,
        displayDurationMinutes: 120
      },
      {
        serviceName: 'Electrical Maintenance',
        initialPrice: 75,
        displayDurationMinutes: 120
      },
      {
        serviceName: 'AC Cleaning & Service',
        initialPrice: 120,
        displayDurationMinutes: 120
      },
      {
        serviceName: 'Home Deep Cleaning',
        initialPrice: 100,
        displayDurationMinutes: 120
      }
    ]);
  }
}
