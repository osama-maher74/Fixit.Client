import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
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

  // Signals for services
  services = signal<ServiceCard[]>([]);
  isLoadingServices = signal<boolean>(true);
  isCraftsman = signal<boolean>(false);

  ngOnInit(): void {
    this.loadServices();
    this.checkUserRole();
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
        console.log('Loaded services from API:', data.length, 'total, showing first 4');
      },
      error: (error: any) => {
        console.error('Error loading services from API:', error);
        this.isLoadingServices.set(false);
        // Don't use fallback - show empty state instead
        this.services.set([]);
      }
    });
  }
}
