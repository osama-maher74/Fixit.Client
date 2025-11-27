import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CraftsmanService } from '../../services/craftsman.service';
import { CraftsmanProfile } from '../../models/craftsman.models';

@Component({
  selector: 'app-craftsman-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './craftsman-details.html',
  styleUrl: './craftsman-details.css'
})
export class CraftsmanDetails implements OnInit {
  private craftsmanService = inject(CraftsmanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  craftsman = signal<CraftsmanProfile | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  isUpdating = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCraftsmanDetails(+id);
    } else {
      this.errorMessage.set('Invalid craftsman ID');
      this.isLoading.set(false);
    }
  }

  private loadCraftsmanDetails(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.craftsmanService.getCraftsManById(id).subscribe({
      next: (data: CraftsmanProfile) => {
        this.craftsman.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading craftsman details:', error);
        this.errorMessage.set(error.error?.message || 'Failed to load craftsman details');
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCraftsmanDetails(+id);
    }
  }

  getProfileImage(craftsman: CraftsmanProfile): string {
    if (!craftsman.profileImage) {
      return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.getFullName(craftsman)) + '&size=400&background=FDB813&color=1E1E1E&bold=true';
    }

    // If it's already a full URL, return it
    if (craftsman.profileImage.startsWith('http://') || craftsman.profileImage.startsWith('https://')) {
      return craftsman.profileImage;
    }

    // Otherwise, construct the full URL with the backend API
    return `https://localhost:7058/${craftsman.profileImage}`;
  }

  getFullName(craftsman: CraftsmanProfile): string {
    return `${craftsman.fName} ${craftsman.lName}`;
  }

  toggleVerification(): void {
    console.log('toggleVerification() called');
    const current = this.craftsman();
    console.log('Current craftsman:', current);

    if (!current) {
      console.log('No craftsman found, returning');
      return;
    }

    console.log('Setting isUpdating to true');
    this.isUpdating.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const updatedCraftsman: CraftsmanProfile = {
      ...current,
      isVerified: !current.isVerified
    };

    console.log('Updated craftsman object:', updatedCraftsman);
    console.log('About to call updateCraftsmanVerification service method');

    this.craftsmanService.updateCraftsmanVerification(updatedCraftsman).subscribe({
      next: (response) => {
        console.log('Update successful - HTTP Response:', response);
        console.log('Response type:', typeof response);

        // Reload the craftsman data from the server to verify the update
        console.log('Reloading craftsman data from server to verify update...');
        this.loadCraftsmanDetails(updatedCraftsman.id);

        this.successMessage.set(`Craftsman ${updatedCraftsman.isVerified ? 'verified' : 'unverified'} successfully!`);
        this.isUpdating.set(false);

        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (error: any) => {
        console.error('Error updating verification status:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        this.errorMessage.set(error.error?.message || 'Failed to update verification status');
        this.isUpdating.set(false);
      },
      complete: () => {
        console.log('Observable completed');
      }
    });
  }
}
