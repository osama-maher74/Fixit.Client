import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-admin-home',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule],
    templateUrl: './admin-home.html',
    styleUrl: './admin-home.css'
})
export class AdminHomeComponent {
    private router = inject(Router);

    navigateTo(path: string) {
        this.router.navigate([path]);
    }
}
