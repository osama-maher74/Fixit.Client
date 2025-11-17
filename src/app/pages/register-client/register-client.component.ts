import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Gender } from '../../models/auth.models';

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-client.component.html',
  styleUrl: './register-client.component.css'
})
export class RegisterClientComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  genderOptions = [
    { value: Gender.Male, label: 'Male' },
    { value: Gender.Female, label: 'Female' }
  ];

  constructor() {
    this.registerForm = this.fb.group({
      fName: ['', [Validators.required, Validators.minLength(2)]],
      lName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      location: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      profileImage: [''],
      gender: [Gender.Male, [Validators.required]],
      dateOfBirth: ['', [Validators.required, this.ageValidator]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordStrengthValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /\d/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[^\w\s]/.test(value);
    const hasMinLength = value.length >= 8;

    const valid = hasNumber && hasUpper && hasLower && hasSpecial && hasMinLength;
    return valid ? null : { passwordStrength: true };
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  ageValidator(control: any) {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    return age >= 18 ? null : { underAge: true };
  }

  get fName() { return this.registerForm.get('fName'); }
  get lName() { return this.registerForm.get('lName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get location() { return this.registerForm.get('location'); }
  get phoneNumber() { return this.registerForm.get('phoneNumber'); }
  get dateOfBirth() { return this.registerForm.get('dateOfBirth'); }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.set(!this.showPassword());
    } else {
      this.showConfirmPassword.set(!this.showConfirmPassword());
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.registerForm.patchValue({
          profileImage: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const formData = { ...this.registerForm.value };
      delete formData.confirmPassword;

      // Convert date to ISO string format
      formData.dateOfBirth = new Date(formData.dateOfBirth).toISOString();

      this.authService.registerClient(formData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('Registration successful! Redirecting to home...');

          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Registration failed. Please try again.');
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}
