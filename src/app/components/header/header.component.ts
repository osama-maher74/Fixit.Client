import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationListComponent } from '../../shared/components/notification-list/notification-list';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NgOptimizedImage, NotificationListComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Make services public for template access
  public authService = inject(AuthService);
  public translationService = inject(TranslationService);
  public themeService = inject(ThemeService);
  public notificationService = inject(NotificationService);
  private elementRef = inject(ElementRef);

  // UI state signals
  public mobileMenuOpen = signal(false);
  public registerDropdownOpen = signal(false);
  public userDropdownOpen = signal(false);
  public notificationDropdownOpen = signal(false);

  onLogout(): void {
    this.authService.logout();
  }

  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  toggleRegisterDropdown(): void {
    this.registerDropdownOpen.set(!this.registerDropdownOpen());
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen.set(!this.userDropdownOpen());
  }

  toggleNotificationDropdown(): void {
    this.notificationDropdownOpen.set(!this.notificationDropdownOpen());
    if (this.notificationDropdownOpen()) {
      // Close other dropdowns
      this.userDropdownOpen.set(false);
      this.registerDropdownOpen.set(false);
    }
  }

  closeMenus(): void {
    this.mobileMenuOpen.set(false);
    this.registerDropdownOpen.set(false);
    this.userDropdownOpen.set(false);
    this.notificationDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenus();
    }
  }
}
