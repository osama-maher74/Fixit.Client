import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="theme-switcher-btn"
      (click)="toggleTheme()"
      [attr.aria-label]="'Switch to ' + (isDark() ? 'light' : 'dark') + ' mode'"
      [title]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <!-- Sun Icon (Light Mode) -->
      @if (isDark()) {
        <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      }

      <!-- Moon Icon (Dark Mode) -->
      @else {
        <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      }
    </button>
  `,
  styles: [`
    .theme-switcher-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: 10px;
      background: var(--background-hover);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: var(--shadow-sm);
    }

    .theme-switcher-btn:hover {
      background: var(--primary-gold);
      color: var(--text-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .theme-switcher-btn:active {
      transform: translateY(0);
    }

    .theme-icon {
      width: 20px;
      height: 20px;
      transition: transform 0.3s ease;
    }

    .theme-switcher-btn:hover .theme-icon {
      transform: rotate(20deg);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .theme-switcher-btn {
        width: 36px;
        height: 36px;
      }

      .theme-icon {
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class ThemeSwitcherComponent {
  private themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDark(): boolean {
    return this.themeService.isDark();
  }

  getCurrentTheme() {
    return this.themeService.currentTheme();
  }
}
