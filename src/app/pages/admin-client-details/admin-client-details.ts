import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ClientService } from '../../services/client.service';
import { ClientProfile } from '../../models/client.models';

@Component({
    selector: 'app-admin-client-details',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './admin-client-details.html',
    styleUrl: './admin-client-details.css'
})
export class AdminClientDetails implements OnInit {
    private clientService = inject(ClientService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    client = signal<ClientProfile | null>(null);
    isLoading = signal<boolean>(true);
    errorMessage = signal<string | null>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadClientDetails(+id);
        } else {
            this.errorMessage.set('Invalid client ID');
            this.isLoading.set(false);
        }
    }

    private loadClientDetails(id: number): void {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        this.clientService.getClientById(id).subscribe({
            next: (data) => {
                this.client.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading client details:', error);
                this.errorMessage.set(error.error?.message || 'Failed to load client details');
                this.isLoading.set(false);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/complaints']);
    }

    retryLoad(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadClientDetails(+id);
        }
    }

    getFullName(client: ClientProfile): string {
        return `${client.fName} ${client.lName}`;
    }

    getProfileImage(client: ClientProfile): string {
        if (!client.profileImage) {
            return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.getFullName(client)) + '&size=200&background=3b82f6&color=fff&bold=true';
        }

        if (client.profileImage.startsWith('http')) {
            return client.profileImage;
        }

        return `https://localhost:7058/${client.profileImage}`;
    }
}
