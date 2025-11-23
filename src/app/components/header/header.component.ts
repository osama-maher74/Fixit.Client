import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NgOptimizedImage],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Make services public for template access
  public authService = inject(AuthService);
  public translationService = inject(TranslationService);
  public themeService = inject(ThemeService);

  // UI state signals
  public mobileMenuOpen = signal(false);
  public registerDropdownOpen = signal(false);

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

  closeMenus(): void {
    this.mobileMenuOpen.set(false);
    this.registerDropdownOpen.set(false);
  }
}
