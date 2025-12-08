import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ServiceService } from '../../services/service.service';
import { ServiceRequestService, CreateServiceRequestDto } from '../../services/service-request.service';
import { ClientService } from '../../services/client.service';
import { ServiceCard } from '../../components/service-card/service-card.component';
import { ThemeService } from '../../services/theme.service';
import { getSwalThemeConfig } from '../../helpers/swal-theme.helper';
import Swal from 'sweetalert2';

// Map service names to multiple image URLs (for gallery display)
const SERVICE_IMAGES: { [key: string]: string[] } = {
  'Plumbing Repair': [

    'assets/pr1.jpeg',
    'assets/pr2.jpeg',
    'assets/pr3.jpeg'
  ],
  'Electrical Maintenance': [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    'assets/ec.jpeg',
    'assets/ec1.jpeg',
  ],
  'AC Cleaning & Service': [
    'assets/ac3.jpeg',
    'assets/ac1.jpeg',
    'assets/ac2.jpeg'

  ],
  'Home Deep Cleaning': [
    'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80',
    'assets/hc.jpeg'
  ],
  'Carpentry & Assembly': [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80'
  ],
  'Painting': [
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581858822450-c2d8e0ec0606?auto=format&fit=crop&w=800&q=80'
  ],
  'Locksmith': [
    'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1597113366969-3c9e7b3e7ad8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
  ],
  'default': [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581578968225-c9d5ad6e0838?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581578968223-10c5b3cee5a1?auto=format&fit=crop&w=800&q=80'
  ]
};

interface ServiceDetails {
  serviceId: number;
  serviceName: string;
  tagline: string;
  description: string;
  features: string[];
  images: string[];
  price: number;
  duration: number; // in minutes
}

@Component({
  selector: 'app-service-booking',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './service-booking.html',
  styleUrl: './service-booking.scss'
})
export class ServiceBookingComponent implements OnInit {
  selectedService: ServiceDetails | null = null;
  bookingForm!: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isSubmitting = false;
  isLoadingService = false; // Track if service is currently being loaded

  private authService = inject(AuthService);
  private serviceService = inject(ServiceService);
  private serviceRequestService = inject(ServiceRequestService);
  private clientService = inject(ClientService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private themeService = inject(ThemeService);

  ngOnInit(): void {
    this.initializeForm();

    // Fetch service from backend based on query parameter
    this.route.queryParams.subscribe(params => {
      const serviceId = params['serviceId'];
      const serviceName = params['service'];

      if (serviceId) {
        // Prefer serviceId if available (more reliable)
        this.loadServiceById(+serviceId);
      } else if (serviceName) {
        // Fallback to serviceName
        this.loadServiceFromBackend(serviceName);
      } else {
        this.selectedService = null;
      }
    });
  }

  private loadServiceById(serviceId: number): void {
    this.isLoadingService = true; // Start loading

    // Fetch all services and filter by ID (more reliable since we know getAllServices works)
    this.serviceService.getAllServices().subscribe({
      next: (services: ServiceCard[]) => {
        const service = services.find(s => s.serviceId === serviceId);
        if (service) {
          this.mapServiceToDetails(service);
        } else {
          console.error('Service not found with ID:', serviceId);
          this.selectedService = null;
        }
        this.isLoadingService = false; // Loading complete
      },
      error: (error) => {
        console.error('Error loading services from backend:', error);
        this.selectedService = null;
        this.isLoadingService = false; // Loading complete (with error)
      }
    });
  }

  private loadServiceFromBackend(serviceName: string): void {
    this.isLoadingService = true; // Start loading

    // Fetch all services and filter by name
    this.serviceService.getAllServices().subscribe({
      next: (services: ServiceCard[]) => {
        const service = services.find(s => s.serviceName === serviceName);
        if (service) {
          this.mapServiceToDetails(service);
        } else {
          console.error('Service not found with name:', serviceName);
          this.selectedService = null;
        }
        this.isLoadingService = false; // Loading complete
      },
      error: (error) => {
        console.error('Error loading services from backend:', error);
        this.selectedService = null;
        this.isLoadingService = false; // Loading complete (with error)
      }
    });
  }

  private mapServiceToDetails(service: ServiceCard): void {
    // Get translated default features
    const defaultFeaturesTranslations = this.translate.instant('SERVICES.DEFAULT_FEATURES');
    const defaultFeatures = Array.isArray(defaultFeaturesTranslations)
      ? defaultFeaturesTranslations
      : [
        'Professional and experienced technicians',
        'Quality service guaranteed',
        'Affordable pricing',
        'Quick response time'
      ];

    // Map the ServiceCard from backend to our ServiceDetails
    this.selectedService = {
      serviceId: service.serviceId, // Service ID from API response
      serviceName: service.serviceName,
      tagline: service.tagline || this.getTranslatedTagline(service.serviceName),
      description: service.description || this.getTranslatedDescription(service.serviceName),
      features: (service.features && service.features.length > 0) ? service.features : defaultFeatures,
      images: this.getServiceImages(service),
      price: service.initialPrice,
      duration: service.displayDurationMinutes
    };

    // Pre-fill suggested price
    if (this.selectedService.price) {
      this.bookingForm.patchValue({
        suggestedPrice: this.selectedService.price
      });
    }
  }

  /**
   * Get translated service name for the currently selected service (public method for template)
   */
  getTranslatedServiceName(): string {
    if (!this.selectedService) return '';
    return this.getTranslatedServiceNameByName(this.selectedService.serviceName);
  }

  /**
   * Get translated service name by service name string
   */
  private getTranslatedServiceNameByName(serviceName: string): string {
    const translationKey = `SERVICES.SERVICE_NAMES.${serviceName}`;
    const translated = this.translate.instant(translationKey);
    return translated !== translationKey ? translated : serviceName;
  }

  /**
   * Get translated service tagline
   */
  private getTranslatedTagline(serviceName: string): string {
    const translationKey = `SERVICES.SERVICE_TAGLINES.${serviceName}`;
    const translated = this.translate.instant(translationKey);
    if (translated !== translationKey) {
      return translated;
    }
    // Fallback to default tagline
    return this.translate.instant('SERVICE_BOOKING.DEFAULT_TAGLINE');
  }

  /**
   * Get translated service description
   */
  private getTranslatedDescription(serviceName: string): string {
    const translationKey = `SERVICES.SERVICE_DESCRIPTIONS.${serviceName}`;
    const translated = this.translate.instant(translationKey);
    if (translated !== translationKey) {
      return translated;
    }
    // Fallback to template
    const translatedServiceName = this.getTranslatedServiceNameByName(serviceName);
    return `Get professional ${translatedServiceName} service from experienced technicians. We ensure high-quality work with customer satisfaction guaranteed.`;
  }

  /**
   * Get service images - use API images if available, otherwise use fallback images
   */
  private getServiceImages(service: ServiceCard): string[] {
    if (service.images && service.images.length > 0) {
      return service.images;
    }

    // Use fallback images based on service name (returns array of 3-4 images)
    const fallbackImages = SERVICE_IMAGES[service.serviceName] || SERVICE_IMAGES['default'];
    return fallbackImages;
  }

  private initializeForm(): void {
    this.bookingForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]],
      location: [''],
      suggestedPrice: ['', [Validators.min(0)]]
    });
  }

  getFormattedDuration(): string {
    if (!this.selectedService) return '';

    const hours = Math.floor(this.selectedService.duration / 60);
    const minutes = this.selectedService.duration % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      const hourLabel = hours === 1 ? this.translate.instant('SERVICE_BOOKING.HOUR') : this.translate.instant('SERVICE_BOOKING.HOURS');
      return `${hours} ${hourLabel}`;
    } else {
      return `${minutes} ${this.translate.instant('SERVICE_BOOKING.MIN')}`;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        Swal.fire({
          ...getSwalThemeConfig(this.themeService.isDark()),
          title: this.translate.instant('SERVICE_BOOKING.ERROR'),
          text: this.translate.instant('SERVICE_BOOKING.FILE_SIZE_ERROR'),
          icon: 'error'
        });
        input.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          ...getSwalThemeConfig(this.themeService.isDark()),
          title: this.translate.instant('SERVICE_BOOKING.ERROR'),
          text: this.translate.instant('SERVICE_BOOKING.FILE_TYPE_ERROR'),
          icon: 'error'
        });
        input.value = '';
        return;
      }

      this.selectedImage = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.bookingForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.bookingForm.get(fieldName);
    if (field?.hasError('required')) {
      return this.translate.instant('SERVICE_BOOKING.FIELD_REQUIRED');
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return this.translate.instant('SERVICE_BOOKING.MIN_LENGTH_REQUIRED', { length: minLength });
    }
    if (field?.hasError('min')) {
      return this.translate.instant('SERVICE_BOOKING.PRICE_MUST_BE_POSITIVE');
    }
    return '';
  }

  onSubmitBooking(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.error('User not authenticated');
      Swal.fire({
        ...getSwalThemeConfig(this.themeService.isDark()),
        title: this.translate.instant('SERVICE_BOOKING.LOGIN_REQUIRED_TITLE') || 'Login Required',
        text: this.translate.instant('SERVICE_BOOKING.LOGIN_REQUIRED'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: this.translate.instant('LOGIN'),
        cancelButtonText: this.translate.instant('CANCEL')
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth/login']);
        }
      });
      return;
    }

    if (this.bookingForm.invalid) {
      console.warn('Form is invalid:', this.bookingForm.errors);
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.selectedService) {
      console.error('No service selected');
      Swal.fire({
        ...getSwalThemeConfig(this.themeService.isDark()),
        title: this.translate.instant('SERVICE_BOOKING.ERROR'),
        text: this.translate.instant('SERVICE_BOOKING.NO_SERVICE_SELECTED'),
        icon: 'error'
      });
      return;
    }

    if (!this.selectedService.serviceId) {
      console.error('Service ID missing:', this.selectedService);
      Swal.fire({
        ...getSwalThemeConfig(this.themeService.isDark()),
        title: this.translate.instant('SERVICE_BOOKING.ERROR'),
        text: this.translate.instant('SERVICE_BOOKING.SERVICE_ID_MISSING'),
        icon: 'error'
      });
      return;
    }

    console.log('Starting service booking process...');
    this.isSubmitting = true;

    // Get client profile to retrieve client ID
    console.log('Fetching client profile...');
    this.clientService.getCurrentUserProfile().subscribe({
      next: (clientProfile) => {
        console.log('Client profile retrieved:', clientProfile);

        // Prepare service request DTO
        const serviceRequestDto: CreateServiceRequestDto = {
          clientId: clientProfile.id,
          serviceId: this.selectedService!.serviceId,
          description: this.bookingForm.value.description,
          location: this.bookingForm.value.location || undefined,
          suggestedPrice: this.bookingForm.value.suggestedPrice || undefined,
          serviceRequestImage: this.selectedImage || undefined
        };

        console.log('Creating service request with data:', serviceRequestDto);

        // Call API using the dedicated service
        this.serviceRequestService.createServiceRequest(serviceRequestDto).subscribe({
          next: (response) => {
            console.log('✅ Service request created successfully:', response);
            this.isSubmitting = false;

            // Navigate to craftsmen list
            const navLocation = this.bookingForm.value.location || clientProfile.location || '';
            const navServiceName = this.selectedService?.serviceName || '';

            if (navLocation && navServiceName) {
              const queryParams = {
                location: navLocation,
                serviceName: navServiceName,
                serviceRequestId: response.servicesRequestId || response.id || 0,
                serviceId: this.selectedService!.serviceId,
                duration: this.selectedService!.duration
              };
              console.log('Navigating to craftsmen-list with params:', queryParams);

              this.router.navigate(['/craftsmen-list'], {
                queryParams: queryParams
              });
            } else {
              Swal.fire({
                ...getSwalThemeConfig(this.themeService.isDark()),
                title: this.translate.instant('SERVICE_BOOKING.SUCCESS'),
                text: this.translate.instant('SERVICE_BOOKING.BOOKING_SUCCESS'),
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.router.navigate(['/']);
            }

            this.bookingForm.reset();
            this.removeImage();
          },
          error: (error) => {
            console.error('❌ Failed to create service request:', error);
            console.error('Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.error?.message,
              fullError: error
            });
            this.isSubmitting = false;

            const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
            Swal.fire({
              ...getSwalThemeConfig(this.themeService.isDark()),
              title: this.translate.instant('SERVICE_BOOKING.ERROR'),
              text: `${this.translate.instant('SERVICE_BOOKING.BOOKING_FAILED')}: ${errorMessage}`,
              icon: 'error'
            });
          }
        });
      },
      error: (error) => {
        console.error('❌ Failed to get client profile:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message,
          fullError: error
        });
        this.isSubmitting = false;

        const errorMessage = error.error?.message || error.message || this.translate.instant('SERVICE_BOOKING.AUTH_ERROR');
        Swal.fire({
          ...getSwalThemeConfig(this.themeService.isDark()),
          title: this.translate.instant('SERVICE_BOOKING.ERROR'),
          text: `${this.translate.instant('SERVICE_BOOKING.AUTH_ERROR')}: ${errorMessage}`,
          icon: 'error',
          showCancelButton: true,
          confirmButtonText: this.translate.instant('LOGIN'),
          cancelButtonText: this.translate.instant('CANCEL')
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/auth/login']);
          }
        });
      }
    });
  }

  goToServices(): void {
    this.router.navigate(['/']);
  }
}
