import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { Gender, CraftsmanRegisterRequest } from '../../models/auth.models';

@Component({
  selector: 'app-register-craftsman',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './register-craftsman.component.html',
  styleUrl: './register-craftsman.component.css'
})
export class RegisterCraftsmanComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  genderOptions = [
    { value: Gender.Male, label: 'REGISTER_CRAFTSMAN.MALE' },
    { value: Gender.Female, label: 'REGISTER_CRAFTSMAN.FEMALE' }
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
      description: [''],
      hourlyRate: [0, [Validators.min(0)]],
      experienceOfYears: [0, [Validators.min(0), Validators.max(50)]],
      nationalId: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z]{5,20}$/)]],
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
  get description() { return this.registerForm.get('description'); }
  get hourlyRate() { return this.registerForm.get('hourlyRate'); }
  get experienceOfYears() { return this.registerForm.get('experienceOfYears'); }
  get nationalId() { return this.registerForm.get('nationalId'); }
  get dateOfBirth() { return this.registerForm.get('dateOfBirth'); }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.set(!this.showPassword());
    } else {
      this.showConfirmPassword.set(!this.showConfirmPassword());
    }
  }


  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      // Build JSON payload matching backend DTO exactly
      const payload: CraftsmanRegisterRequest = {
        fName: this.registerForm.value.fName,
        lName: this.registerForm.value.lName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        location: this.registerForm.value.location,
        phoneNumber: this.registerForm.value.phoneNumber,
        description: this.registerForm.value.description || '',
        hourlyRate: this.registerForm.value.hourlyRate || 0,
        experienceOfYears: this.registerForm.value.experienceOfYears || 0,
        nationalId: this.registerForm.value.nationalId,
        gender: this.registerForm.value.gender, // Number: 0 = Male, 1 = Female
        dateOfBirth: new Date(this.registerForm.value.dateOfBirth).toISOString() // ISO format: "2025-11-21T12:38:45.051Z"
      };

      console.log('Submitting craftsman registration JSON:', payload);

      this.authService.registerCraftsman(payload).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set(this.translate.instant('REGISTER_CRAFTSMAN.SUCCESS_MESSAGE'));

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Craftsman registration error:', error);
          this.errorMessage.set(error.message || this.translate.instant('REGISTER_CRAFTSMAN.ERROR_DEFAULT'));
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}
