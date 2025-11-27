import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CraftsmanService } from '../../services/craftsman.service';
import { CraftsmanProfile } from '../../models/craftsman.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  private craftsmanService = inject(CraftsmanService);
  private router = inject(Router);

  craftsmen = signal<CraftsmanProfile[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    console.log('Admin Dashboard - Component Initialized');
    this.loadCraftsmen();
  }

  private loadCraftsmen(): void {
    console.log('Admin Dashboard - Loading craftsmen...');
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.craftsmanService.getAllCraftsMen().subscribe({
      next: (data: CraftsmanProfile[]) => {
        console.log('Admin Dashboard - Craftsmen loaded:', data);
        console.log('Admin Dashboard - Number of craftsmen:', data.length);
        this.craftsmen.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Admin Dashboard - Error loading craftsmen:', error);
        console.error('Admin Dashboard - Error details:', error.error);
        this.errorMessage.set(error.error?.message || 'Failed to load craftsmen');
        this.isLoading.set(false);
      }
    });
  }

  retryLoad(): void {
    this.loadCraftsmen();
  }

  viewCraftsmanDetails(id: number): void {
    this.router.navigate(['/admin/craftsman', id]);
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
}
