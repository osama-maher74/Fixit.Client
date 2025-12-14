import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { NotificationListComponent } from '../../shared/components/notification-list/notification-list';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NgOptimizedImage,
    NotificationListComponent,
    ThemeSwitcherComponent,
    LanguageSwitcherComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  // Make services public for template access
  public authService = inject(AuthService);
  public translationService = inject(TranslationService);
  public translate = inject(TranslateService);
  public themeService = inject(ThemeService);
  public notificationService = inject(NotificationService);

  getUserDisplayName(user: any): string {
    if (!user) return '';
    const fullName = `${user.fName} ${user.lName}`;
    if (fullName.trim() === 'System Admin') {
      return this.translate.instant('ADMIN.DASHBOARD.SYSTEM_ADMIN');
    }
    return fullName;
  }

  private craftsmanService = inject(CraftsmanService);
  private elementRef = inject(ElementRef);

  // UI state signals
  public mobileMenuOpen = signal(false);
  public registerDropdownOpen = signal(false);
  public userDropdownOpen = signal(false);
  public notificationDropdownOpen = signal(false);
  public craftsmanIsVerified = signal<boolean | null>(null);

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

  private router = inject(Router);

  toggleNotificationDropdown(): void {
    if (window.innerWidth <= 768) {
      this.router.navigate(['/notifications']);
      this.closeMenus();
      return;
    }

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

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'Admin';
  }

  getProfileRoute(): string {
    return this.isAdmin() ? '/admin/dashboard' : '/profile';
  }

  isCraftsman(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role?.toLowerCase() === 'craftsman';
  }

  shouldShowVerifyId(): boolean {
    if (!this.isCraftsman()) {
      return false;
    }

    // Load craftsman profile to check verification status
    if (this.craftsmanIsVerified() === null) {
      this.craftsmanService.getCurrentUserProfile().subscribe({
        next: (profile) => {
          this.craftsmanIsVerified.set(profile.isVerified);
        },
        error: () => {
          this.craftsmanIsVerified.set(false);
        }
      });
      return false; // Don't show until we know the status
    }

    return this.craftsmanIsVerified() === false;
  }
}
