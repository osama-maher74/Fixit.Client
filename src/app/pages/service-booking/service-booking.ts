import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ServiceService } from '../../services/service.service';
import { ClientService } from '../../services/client.service';

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

interface BookingRequest {
  clientId: number;
  serviceId: number;
  description: string;
  location?: string;
  serviceRequestImage?: File;
  serviceStartTime: Date;
  suggestedPrice?: number;
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

  private authService = inject(AuthService);
  private serviceService = inject(ServiceService);
  private clientService = inject(ClientService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Service data dictionary with IDs
  private servicesData: { [key: string]: ServiceDetails } = {
    'Plumbing Repair': {
      serviceId: 1,
      serviceName: 'Plumbing Repair',
      tagline: 'Expert plumbing solutions for your home',
      description: 'Our professional plumbers are trained to handle all types of plumbing issues, from leaky faucets to burst pipes. We use high-quality materials and modern techniques to ensure long-lasting repairs. Available 24/7 for emergency plumbing services.',
      features: [
        'Leak detection and repair',
        'Pipe installation and replacement',
        'Drain cleaning and unclogging',
        'Water heater repair and installation',
        'Bathroom and kitchen plumbing',
        '24/7 emergency service available'
      ],
      images: [
        'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80',
        'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80',
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80'
      ],
      price: 50,
      duration: 120
    },
    'Electrical Maintenance': {
      serviceId: 2,
      serviceName: 'Electrical Maintenance',
      tagline: 'Safe and reliable electrical services',
      description: 'Our certified electricians provide comprehensive electrical services for residential and commercial properties. From simple repairs to complete rewiring, we ensure your electrical systems are safe, efficient, and up to code.',
      features: [
        'Electrical wiring and rewiring',
        'Circuit breaker repair and replacement',
        'Light fixture installation',
        'Outlet and switch installation',
        'Electrical safety inspections',
        'Smart home electrical setup'
      ],
      images: [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
        'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80'
      ],
      price: 60,
      duration: 90
    },
    'AC Cleaning & Service': {
      serviceId: 3,
      serviceName: 'AC Cleaning & Service',
      tagline: 'Keep your air conditioning running smoothly',
      description: 'Regular AC maintenance ensures optimal performance and energy efficiency. Our technicians clean, inspect, and service all types of air conditioning units, helping you stay cool while reducing energy costs.',
      features: [
        'Complete AC unit cleaning',
        'Filter replacement and cleaning',
        'Refrigerant level check',
        'Thermostat calibration',
        'Duct cleaning and inspection',
        'Performance optimization'
      ],
      images: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
        'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=80',
        'https://images.unsplash.com/photo-1635274143589-331ba33b4676?w=800&q=80'
      ],
      price: 45,
      duration: 60
    },
    'Home Deep Cleaning': {
      serviceId: 4,
      serviceName: 'Home Deep Cleaning',
      tagline: 'Spotless homes, happy lives',
      description: 'Experience a thoroughly clean home with our deep cleaning service. Our professional cleaners use eco-friendly products and proven techniques to clean every corner of your home, leaving it fresh and sanitized.',
      features: [
        'Kitchen deep cleaning',
        'Bathroom sanitization',
        'Floor scrubbing and polishing',
        'Window and glass cleaning',
        'Furniture and upholstery cleaning',
        'Eco-friendly cleaning products'
      ],
      images: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
        'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&q=80',
        'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80'
      ],
      price: 80,
      duration: 180
    },
    'Carpentry & Assembly': {
      serviceId: 5,
      serviceName: 'Carpentry & Assembly',
      tagline: 'Custom woodwork and furniture assembly',
      description: 'From custom carpentry to furniture assembly, our skilled craftsmen bring your vision to life. We handle everything from simple repairs to complex custom builds with precision and attention to detail.',
      features: [
        'Furniture assembly and installation',
        'Custom cabinet making',
        'Door and window frame repair',
        'Shelving and storage solutions',
        'Wood restoration and refinishing',
        'Custom woodwork projects'
      ],
      images: [
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'
      ],
      price: 55,
      duration: 120
    },
    'Painting': {
      serviceId: 6,
      serviceName: 'Painting',
      tagline: 'Transform your space with color',
      description: 'Professional painting services for interior and exterior surfaces. Our experienced painters deliver flawless results using premium paints and materials. We handle all prep work and ensure a clean finish every time.',
      features: [
        'Interior and exterior painting',
        'Wall preparation and priming',
        'Ceiling and trim painting',
        'Color consultation',
        'Texture and finish options',
        'Clean-up and protection'
      ],
      images: [
        'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80',
        'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80'
      ],
      price: 70,
      duration: 240
    },
    'Locksmith': {
      serviceId: 7,
      serviceName: 'Locksmith',
      tagline: 'Secure your home with expert locksmith services',
      description: 'Professional locksmith services available 24/7 for all your security needs. From lockouts to lock installations and rekeying, our certified locksmiths provide fast, reliable, and secure solutions.',
      features: [
        'Emergency lockout service',
        'Lock installation and replacement',
        'Key duplication and cutting',
        'Rekeying services',
        'Smart lock installation',
        'Security assessments'
      ],
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        'https://images.unsplash.com/photo-1582139329536-e7ff9c4a9b3e?w=800&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80'
      ],
      price: 40,
      duration: 45
    }
  };

  ngOnInit(): void {
    // Initialize form
    this.initializeForm();

    // Get service name from query parameters
    this.route.queryParams.subscribe(params => {
      const serviceName = params['service'];
      if (serviceName && this.servicesData[serviceName]) {
        this.selectedService = this.servicesData[serviceName];
      } else {
        this.selectedService = null;
      }
    });
  }

  private initializeForm(): void {
    this.bookingForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]],
      location: [''],
      serviceStartTime: ['', [Validators.required]],
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
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${minutes} min`;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        input.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, and WebP images are allowed');
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
      return 'This field is required';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (field?.hasError('min')) {
      return 'Price must be positive';
    }
    return '';
  }

  onSubmitBooking(): void {
    if (this.bookingForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.selectedService) {
      alert('No service selected');
      return;
    }

    this.isSubmitting = true;

    // Get client profile to retrieve client ID
    this.clientService.getCurrentUserProfile().subscribe({
      next: (clientProfile) => {
        // Prepare FormData for multipart/form-data request
        const formData = new FormData();

        // Add required fields
        formData.append('ClientId', clientProfile.id.toString());
        formData.append('ServiceId', this.selectedService!.serviceId.toString());
        formData.append('Description', this.bookingForm.value.description);
        formData.append('ServiceStartTime', new Date(this.bookingForm.value.serviceStartTime).toISOString());

        // Add optional fields
        if (this.bookingForm.value.location) {
          formData.append('Location', this.bookingForm.value.location);
        }

        if (this.bookingForm.value.suggestedPrice) {
          formData.append('SuggestedPrice', this.bookingForm.value.suggestedPrice.toString());
        }

        // Add image if selected
        if (this.selectedImage) {
          formData.append('ServiceRequestImage', this.selectedImage, this.selectedImage.name);
        }

        // Debug: Log FormData contents
        console.log('=== FormData Contents ===');
        formData.forEach((value, key) => {
          console.log(`${key}:`, value);
        });

        // Call API
        this.serviceService.createServiceRequest(formData).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            console.log('Service request created successfully:', response);
            alert(`Booking request submitted successfully for ${this.selectedService?.serviceName}!`);
            this.bookingForm.reset();
            this.removeImage();
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error creating service request:', error);
            alert(`Failed to submit booking request. ${error.error?.message || 'Please try again later.'}`);
          }
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error getting client profile:', error);
        alert('Failed to get client information. Please make sure you are logged in.');
      }
    });
  }

  goToServices(): void {
    this.router.navigate(['/']);
  }
}
