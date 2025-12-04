import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css'
})
export class ContactUsComponent implements OnInit {
  private fb = inject(FormBuilder);

  contactForm!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      message: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;

      // Log form data to console as per requirements
      console.log('Contact Form Submitted:', this.contactForm.value);

      // Simulate form submission delay
      setTimeout(() => {
        this.isSubmitting = false;
        alert('Thank you for contacting us! Your message has been received.');
        this.contactForm.reset();
      }, 1000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }
}
