import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ViewportScroller } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ServiceService } from '../../services/service.service';
import { ServiceCardComponent, ServiceCard } from '../../components/service-card/service-card.component';
import { ChatWidgetComponent } from '../../components/chat-widget/chat-widget.component';
import { ContactService } from '../../services/contact.service';
import { ToastService } from '../../services/toast.service';
import { ContactFormDto } from '../../models/contact.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslateModule, ServiceCardComponent, ChatWidgetComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  private serviceService = inject(ServiceService);
  private contactService = inject(ContactService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private viewportScroller = inject(ViewportScroller);
  private fb = inject(FormBuilder);

  // Signals for services
  services = signal<ServiceCard[]>([]);
  isLoadingServices = signal<boolean>(true);
  isCraftsman = signal<boolean>(false);

  // Contact form
  contactForm!: FormGroup;
  isSubmittingContact = false;

  ngOnInit(): void {
    this.loadServices();
    this.checkUserRole();
    this.handleFragmentScroll();
    this.initializeContactForm();
  }

  /**
   * Initialize contact form
   */
  private initializeContactForm(): void {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      message: ['', [Validators.required]]
    });
  }

  /**
   * Handle contact form submission
   */
  onContactSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmittingContact = true;
      const contactData: ContactFormDto = this.contactForm.value;

      this.contactService.sendContactMessage(contactData).subscribe({
        next: () => {
          this.isSubmittingContact = false;
          this.toastService.success('Your message has been sent successfully!');
          this.contactForm.reset();
        },
        error: (error) => {
          console.error('Error sending contact message:', error);
          this.isSubmittingContact = false;
          this.toastService.error('Failed to send message. Please try again later.');
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
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
