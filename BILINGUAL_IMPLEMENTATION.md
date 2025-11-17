# FixIt - Bilingual Implementation Guide

## ✅ Completed Tasks

### 1. Installed Dependencies
- ✅ `@ngx-translate/core` and `@ngx-translate/http-loader` installed
- ✅ `@angular/material` and `@angular/cdk` installed

### 2. Configuration Files Created
- ✅ Translation Service: [src/app/services/translation.service.ts](src/app/services/translation.service.ts)
- ✅ English translations: [src/assets/i18n/en.json](src/assets/i18n/en.json)
- ✅ Arabic translations: [src/assets/i18n/ar.json](src/assets/i18n/ar.json)
- ✅ Global styles with Maharah colors: [src/styles.css](src/styles.css)
- ✅ Cairo font added to [src/index.html](src/index.html)
- ✅ App config updated with translation module: [src/app/app.config.ts](src/app/app.config.ts)

### 3. Color Scheme Applied (Maharah Style)
- Primary Yellow: `#f5f549`
- Primary Dark: `#2c3e50`
- Font: Cairo (Google Fonts)
- RTL support added for Arabic

## 📝 Next Steps - Update Components

To complete the bilingual implementation, you need to update the existing components to use translations. Here's what needs to be done for each component:

### Step 1: Update Header Component

**File**: `src/app/components/header/header.component.ts`

Add the translation service and TranslateModule:

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  authService = inject(AuthService);
  translationService = inject(TranslationService);

  onLogout(): void {
    this.authService.logout();
  }

  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }
}
```

**File**: `src/app/components/header/header.component.html`

Replace content with:

```html
<header class="header">
  <div class="container">
    <div class="header-content">
      <div class="logo">
        <a routerLink="/">{{ 'APP_NAME' | translate }}</a>
      </div>

      <nav class="nav">
        <button (click)="toggleLanguage()" class="lang-switcher">
          {{ translationService.currentLang() === 'en' ? 'العربية' : 'English' }}
        </button>

        @if (!authService.isAuthenticated()) {
          <a routerLink="/login" routerLinkActive="active" class="nav-link">
            {{ 'HEADER.LOGIN' | translate }}
          </a>
          <div class="nav-dropdown">
            <button class="nav-link dropdown-toggle">
              {{ 'HEADER.REGISTER' | translate }}
            </button>
            <div class="dropdown-menu">
              <a routerLink="/register/client" class="dropdown-item">
                {{ 'HEADER.REGISTER_AS_CLIENT' | translate }}
              </a>
              <a routerLink="/register/craftsman" class="dropdown-item">
                {{ 'HEADER.REGISTER_AS_CRAFTSMAN' | translate }}
              </a>
            </div>
          </div>
        } @else {
          @if (authService.currentUser$ | async; as user) {
            <div class="user-menu">
              <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
              <button (click)="onLogout()" class="btn-logout">
                {{ 'HEADER.LOGOUT' | translate }}
              </button>
            </div>
          }
        }
      </nav>
    </div>
  </div>
</header>
```

**File**: `src/app/components/header/header.component.css`

Update with Maharah colors:

```css
.header {
  background-color: var(--primary-dark);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo a {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.logo a:hover {
  color: var(--primary-yellow);
}

.nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.lang-switcher {
  background-color: var(--primary-yellow);
  color: var(--primary-dark);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Cairo', sans-serif;
  transition: all 0.3s;
}

.lang-switcher:hover {
  background-color: #e8e842;
  transform: translateY(-2px);
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-family: 'Cairo', sans-serif;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  background-color: var(--primary-yellow);
  color: var(--primary-dark);
}

.nav-dropdown {
  position: relative;
}

.dropdown-toggle::after {
  content: ' ▼';
  font-size: 0.7rem;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  min-width: 150px;
  margin-top: 0.5rem;
  z-index: 1000;
}

[dir="rtl"] .dropdown-menu {
  left: auto;
  right: 0;
}

.nav-dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--primary-dark);
  text-decoration: none;
  transition: background-color 0.3s;
}

.dropdown-item:hover {
  background-color: var(--background-light);
}

.user-menu {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-name {
  color: white;
}

.btn-logout {
  background-color: var(--error-red);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-family: 'Cairo', sans-serif;
  transition: background-color 0.3s;
}

.btn-logout:hover {
  background-color: #c0392b;
}
```

### Step 2: Update Footer Component

**File**: `src/app/components/footer/footer.component.ts`

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
```

**File**: `src/app/components/footer/footer.component.html`

```html
<footer class="footer">
  <div class="container">
    <p>&copy; {{ currentYear }} {{ 'APP_NAME' | translate }}. {{ 'FOOTER.COPYRIGHT' | translate }}</p>
  </div>
</footer>
```

### Step 3: Update the App Component to Initialize Translation

**File**: `src/app/app.ts`

```typescript
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Fixit.Client');
  private translationService = inject(TranslationService);
}
```

**File**: `src/app/app.html`

Replace the entire content with:

```html
<app-header></app-header>
<main style="flex: 1">
  <router-outlet />
</main>
<app-footer></app-footer>
```

**File**: `src/app/app.css`

```css
:host {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
```

### Step 4: Quick Test Commands

After making the updates above, test your application:

```bash
ng serve
```

Then open your browser to `http://localhost:4200` and:
1. Click the language switcher button in the header
2. Verify that the text changes between English and Arabic
3. Verify that the layout switches between LTR and RTL
4. Check that the Maharah color scheme (yellow #f5f549) is applied

## 🎨 Maharah Color Scheme Reference

- **Primary Yellow**: `#f5f549`
- **Light Yellow**: `#f7f7c8`
- **Primary Dark**: `#2c3e50`
- **Text Dark**: `#333333`
- **Text Gray**: `#7f8c8d`
- **Background Light**: `#f8f9fa`
- **Error Red**: `#e74c3c`
- **Success Green**: `#27ae60`

## 📱 Features Implemented

✅ Bilingual support (English/Arabic)
✅ RTL/LTR automatic switching
✅ Cairo font (Maharah style)
✅ Maharah color scheme
✅ Language switcher button
✅ Translation files for all pages
✅ Form validation messages in both languages
✅ Persistent language selection (localStorage)

## 🔄 Translation Keys Structure

All translation keys follow this pattern:
- `APP_NAME` - Application name
- `HEADER.*` - Header navigation items
- `FOOTER.*` - Footer content
- `HOME.*` - Home page content
- `LOGIN.*` - Login page content
- `REGISTER_CLIENT.*` - Client registration
- `REGISTER_CRAFTSMAN.*` - Craftsman registration

## 📚 Additional Resources

- [ngx-translate Documentation](https://github.com/ngx-translate/core)
- [Angular i18n Guide](https://angular.io/guide/i18n)
- [Cairo Font on Google Fonts](https://fonts.google.com/specimen/Cairo)

## 🚀 Next Steps

If you want to add more translations:
1. Add the key to both `en.json` and `ar.json`
2. Use `{{ 'YOUR_KEY' | translate }}` in templates
3. Or use `this.translateService.instant('YOUR_KEY')` in TypeScript

## ⚠️ Important Notes

- The language preference is saved in localStorage
- Document direction (RTL/LTR) is automatically updated
- Number inputs remain LTR even in Arabic (for phone numbers, etc.)
- The translation service initializes on app startup
