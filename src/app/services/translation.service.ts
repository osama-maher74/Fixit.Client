import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  currentLang = signal<string>('en');
  isRTL = signal<boolean>(false);

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en');

    // Check for saved language preference
    const savedLang = localStorage.getItem('language') || 'en';
    this.setLanguage(savedLang);
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    this.isRTL.set(lang === 'ar');
    localStorage.setItem('language', lang);

    // Update document direction and lang attribute
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  toggleLanguage(): void {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  getTranslation(key: string): string {
    return this.translate.instant(key);
  }
}
