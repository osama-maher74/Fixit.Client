import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ContactService } from '../../services/contact.service';
import { ToastService } from '../../services/toast.service';
import { ContactFormDto } from '../../models/contact.models';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent implements OnInit {
  private contactService = inject(ContactService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  contactForm!: FormGroup;
  isSubmittingContact = false;

  ngOnInit(): void {
    this.initializeContactForm();
  }

  private initializeContactForm(): void {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      message: ['', [Validators.required]]
    });
  }

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
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }
}
