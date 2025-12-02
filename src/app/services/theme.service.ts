import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal to track current theme
  currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Effect to apply theme changes
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.saveThemePreference(theme);
    });

    // Listen to system theme changes
    this.listenToSystemThemeChanges();
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  private getInitialTheme(): Theme {
    // Check localStorage first
    const savedTheme = localStorage.getItem('fixit-theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Default to light theme
    return 'light';
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }

    // Add data attribute for CSS selectors
    root.setAttribute('data-theme', theme);

    console.log(`✨ Theme applied: ${theme}`);
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemePreference(theme: Theme): void {
    try {
      localStorage.setItem('fixit-theme', theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    this.currentTheme.update(current => current === 'light' ? 'dark' : 'light');
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Check if current theme is dark
   */
  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }

  /**
   * Listen to system theme changes and auto-switch if no user preference stored
   */
  private listenToSystemThemeChanges(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const hasUserPreference = localStorage.getItem('fixit-theme') !== null;
      if (!hasUserPreference) {
        const systemTheme: Theme = e.matches ? 'dark' : 'light';
        this.currentTheme.set(systemTheme);
      }
    });
  }
}
