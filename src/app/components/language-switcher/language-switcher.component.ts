import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="lang-switcher"
      (click)="toggleLanguage()"
      [attr.aria-label]="'Switch to ' + (isArabic() ? 'English' : 'Arabic')"
    >
      {{ isArabic() ? 'English' : 'العربية' }}
    </button>
  `,
  styles: [`
    .lang-switcher {
      padding: 0.5rem 1rem;
      background: transparent;
      border: 2px solid var(--primary-gold);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: 'Cairo', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .lang-switcher:hover {
      background: var(--primary-gold);
      color: var(--text-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .lang-switcher:active {
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .lang-switcher {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }
    }
  `]
})
export class LanguageSwitcherComponent {
  private translationService = inject(TranslationService);

  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }

  isArabic(): boolean {
    return this.currentLang() === 'ar';
  }

  currentLang() {
    return this.translationService.currentLang();
  }
}
