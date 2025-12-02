# 🔨 Page Refactoring Guide - Best Practices & Patterns

This guide provides comprehensive patterns and best practices for refactoring all pages in the Fixit application to be fully responsive, accessible, and maintainable.

---

## 📋 Table of Contents

1. [Component Structure](#component-structure)
2. [Responsive Design Patterns](#responsive-design-patterns)
3. [Translation & i18n](#translation--i18n)
4. [Theme Integration](#theme-integration)
5. [Common UI Patterns](#common-ui-patterns)
6. [Performance Optimization](#performance-optimization)
7. [Accessibility](#accessibility)
8. [Code Organization](#code-organization)

---

## 🏗️ Component Structure

### TypeScript Component Template

```typescript
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ResponsiveService } from '@app/services/responsive.service';
import { ThemeService } from '@app/services/theme.service';

@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    // ... other imports
  ],
  templateUrl: './your-component.html',
  styleUrl: './your-component.scss'
})
export class YourComponent {
  // Services - use inject() pattern
  protected responsive = inject(ResponsiveService);
  protected theme = inject(ThemeService);

  // State - use signals
  protected isLoading = signal(false);
  protected data = signal<DataType | null>(null);
  protected errorMessage = signal<string | null>(null);

  // Computed values - derive state with computed()
  protected hasData = computed(() => this.data() !== null);
  protected isMobileLayout = computed(() => this.responsive.state().isMobile);

  // Methods
  protected loadData(): void {
    // Implementation
  }
}
```

### Key Principles

1. **Use Signals** - All reactive state should use signals
2. **Use inject()** - Prefer `inject()` over constructor injection
3. **Protected properties** - Make template-accessible properties `protected`
4. **Standalone components** - All components should be standalone
5. **Computed derived state** - Use `computed()` for derived values

---

## 📱 Responsive Design Patterns

### Pattern 1: Responsive Layout Container

```typescript
// TypeScript
protected columns = computed(() => {
  const state = this.responsive.state();
  if (state.is2xl) return 4;
  if (state.isXl) return 3;
  if (state.isLg) return 3;
  if (state.isMd) return 2;
  return 1;
});
```

```html
<!-- Template -->
<div class="container">
  <div class="grid" [attr.data-cols]="columns()">
    @for (item of items; track item.id) {
      <app-card [data]="item"></app-card>
    }
  </div>
</div>
```

```scss
// SCSS
@import '../../../styles/responsive';

.container {
  @include responsive-container;
  @include responsive-padding(1rem, 2rem, 3rem);
}

.grid {
  display: grid;
  gap: 1.5rem;

  &[data-cols="1"] { grid-template-columns: 1fr; }
  &[data-cols="2"] { grid-template-columns: repeat(2, 1fr); }
  &[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }
  &[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
}
```

### Pattern 2: Conditional Mobile/Desktop Rendering

```typescript
// TypeScript
protected showSidebar = computed(() =>
  this.responsive.state().isDesktop
);

protected showMobileNav = computed(() =>
  this.responsive.state().isMobile
);
```

```html
<!-- Template -->
<div class="layout">
  @if (showSidebar()) {
    <aside class="sidebar">
      <app-navigation></app-navigation>
    </aside>
  }

  <main class="content">
    <!-- Main content -->
  </main>

  @if (showMobileNav()) {
    <app-mobile-nav></app-mobile-nav>
  }
</div>
```

```scss
// SCSS
@import '../../../styles/responsive';

.layout {
  display: flex;

  @include mobile-only {
    flex-direction: column;
  }

  .sidebar {
    @include hide-mobile;
    width: 280px;
    @include responsive-padding(1rem, 1.5rem, 2rem);
  }

  .content {
    flex: 1;
    min-width: 0; // Prevent flex overflow
  }
}
```

### Pattern 3: Responsive Typography

```scss
@import '../../../styles/responsive';

.page-title {
  @include responsive-font(1.75rem, 2.25rem, 3rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: var(--text-dark);
}

.section-title {
  @include responsive-font(1.25rem, 1.5rem, 1.75rem);
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.body-text {
  @include responsive-font(0.875rem, 1rem, 1rem);
  line-height: 1.6;
  color: var(--text-secondary);
}
```

### Pattern 4: Responsive Card Layouts

```scss
@import '../../../styles/responsive';

.card {
  background: var(--background-white);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all 0.3s ease;

  @include mobile-only {
    border-radius: 8px;
  }

  @include respond-above('md') {
    display: flex;

    .card-image {
      width: 200px;
      height: 200px;
    }
  }

  @include mobile-only {
    .card-image {
      width: 100%;
      height: 250px;
    }
  }

  .card-content {
    @include responsive-padding(1rem, 1.5rem, 2rem);
    flex: 1;
  }

  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
}
```

---

## 🌍 Translation & i18n

### Pattern 1: All Text Must Be Translatable

```html
<!-- ❌ BAD - Hardcoded text -->
<h1>Welcome to Fixit</h1>
<button>Submit</button>
<p>No results found</p>

<!-- ✅ GOOD - Translated text -->
<h1>{{ 'HOME.TITLE' | translate }}</h1>
<button>{{ 'COMMON.SUBMIT' | translate }}</button>
<p>{{ 'COMMON.NO_RESULTS' | translate }}</p>
```

### Pattern 2: Dynamic Translation with Parameters

```html
<!-- Template -->
<p>{{ 'OFFER_REVIEW.DIALOGS.ACCEPT_TEXT' | translate: {amount: finalAmount} }}</p>
```

```json
// en.json
{
  "OFFER_REVIEW": {
    "DIALOGS": {
      "ACCEPT_TEXT": "Are you sure you want to accept this offer for {amount} EGP?"
    }
  }
}
```

### Pattern 3: Conditional Translation

```html
<span>
  {{ isAdmin() ? ('HEADER.DASHBOARD' | translate) : ('HEADER.PROFILE' | translate) }}
</span>
```

### Translation File Organization

```
public/assets/i18n/
├── en.json  (English - Primary)
├── ar.json  (Arabic - Secondary with RTL support)
```

**Key Structure:**
```json
{
  "FEATURE_NAME": {
    "TITLE": "...",
    "SUBTITLE": "...",
    "ACTIONS": {
      "SUBMIT": "...",
      "CANCEL": "..."
    },
    "MESSAGES": {
      "SUCCESS": "...",
      "ERROR": "..."
    },
    "VALIDATION": {
      "FIELD_REQUIRED": "..."
    }
  }
}
```

---

## 🎨 Theme Integration

### Pattern 1: Always Use CSS Variables

```scss
/* ❌ BAD - Hardcoded colors */
.card {
  background: #FFFFFF;
  color: #1E1E1E;
  border: 1px solid #E5E7EB;
}

/* ✅ GOOD - CSS variables (theme-aware) */
.card {
  background: var(--background-white);
  color: var(--text-dark);
  border: 1px solid var(--border-light);
}
```

### Available CSS Variables

**Backgrounds:**
- `var(--background-white)` - Primary background
- `var(--background-light)` - Secondary background
- `var(--background-accent)` - Accent background
- `var(--background-hover)` - Hover states

**Text:**
- `var(--text-dark)` - Headlines/primary text
- `var(--text-primary)` - Body text
- `var(--text-secondary)` - Secondary text
- `var(--text-muted)` - Muted/disabled text

**Borders:**
- `var(--border-light)` - Light borders
- `var(--border-medium)` - Medium borders
- `var(--border-dark)` - Dark borders

**Brand:**
- `var(--primary-gold)` - Primary brand color
- `var(--primary-gold-hover)` - Hover state
- `var(--primary-gold-light)` - Light backgrounds

**Status:**
- `var(--error-red)` / `var(--error-light)`
- `var(--success-green)` / `var(--success-light)`
- `var(--warning-yellow)`
- `var(--info-blue)`

**Shadows:**
- `var(--shadow-sm)` - Subtle elevation
- `var(--shadow-md)` - Medium elevation
- `var(--shadow-lg)` - High elevation
- `var(--shadow-xl)` - Maximum elevation

### Pattern 2: Theme-Aware Components

```typescript
// TypeScript
protected isDark = computed(() => this.theme.isDark());
```

```html
<!-- Template - Conditionally show different icons -->
@if (isDark()) {
  <img src="assets/images/logo-light.svg" alt="Logo" />
} @else {
  <img src="assets/images/logo-dark.svg" alt="Logo" />
}
```

---

## 🎯 Common UI Patterns

### Pattern 1: Loading State

```typescript
// TypeScript
protected isLoading = signal(false);

protected async loadData(): Promise<void> {
  this.isLoading.set(true);
  try {
    const data = await this.service.getData();
    this.data.set(data);
  } catch (error) {
    this.errorMessage.set('Failed to load data');
  } finally {
    this.isLoading.set(false);
  }
}
```

```html
<!-- Template -->
@if (isLoading()) {
  <div class="loading-wrapper">
    <div class="loading-spinner"></div>
    <p class="loading-text">{{ 'COMMON.LOADING' | translate }}</p>
  </div>
} @else if (errorMessage()) {
  <div class="error-wrapper">
    <p class="error-message">{{ errorMessage() }}</p>
    <button (click)="loadData()">{{ 'COMMON.RETRY' | translate }}</button>
  </div>
} @else if (data()) {
  <!-- Show data -->
}
```

```scss
// SCSS
@import '../../../styles/responsive';

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  @include responsive-padding(2rem, 3rem, 4rem);

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border-light);
    border-top-color: var(--primary-gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-text {
    margin-top: 1rem;
    color: var(--text-secondary);
    @include responsive-font(0.875rem, 1rem, 1rem);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Pattern 2: Empty State

```html
<div class="empty-state">
  <div class="empty-icon">
    <svg>...</svg>
  </div>
  <h3 class="empty-title">{{ 'COMMON.NO_DATA' | translate }}</h3>
  <p class="empty-text">{{ 'COMMON.NO_DATA_DESCRIPTION' | translate }}</p>
  <button class="btn btn-primary" (click)="createNew()">
    {{ 'COMMON.CREATE_NEW' | translate }}
  </button>
</div>
```

```scss
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  @include responsive-padding(3rem, 4rem, 5rem);

  .empty-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 1.5rem;
    color: var(--text-muted);
  }

  .empty-title {
    @include responsive-font(1.25rem, 1.5rem, 1.75rem);
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
  }

  .empty-text {
    color: var(--text-secondary);
    margin-bottom: 2rem;
    max-width: 400px;
  }
}
```

### Pattern 3: Action Buttons

```scss
@import '../../../styles/responsive';

.action-buttons {
  display: flex;
  gap: 1rem;

  @include mobile-only {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }

  @include respond-above('md') {
    justify-content: flex-end;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  @include responsive-padding(0.75rem 1.5rem, 0.875rem 1.75rem, 1rem 2rem);
  border: none;
  border-radius: 8px;
  font-family: 'Cairo', sans-serif;
  @include responsive-font(0.875rem, 1rem, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &.btn-primary {
    background: var(--primary-gold);
    color: var(--text-dark);
    box-shadow: var(--shadow-md);

    &:hover:not(:disabled) {
      background: var(--primary-gold-hover);
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
  }

  &.btn-secondary {
    background: var(--background-white);
    color: var(--primary-gold);
    border: 2px solid var(--primary-gold);

    &:hover:not(:disabled) {
      background: var(--primary-gold-light);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

### Pattern 4: Modal/Dialog

```html
@if (showModal()) {
  <div class="modal-overlay" (click)="closeModal()">
    <div class="modal-content" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2 class="modal-title">{{ 'MODAL.TITLE' | translate }}</h2>
        <button class="modal-close" (click)="closeModal()">
          <svg>...</svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- Modal content -->
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" (click)="closeModal()">
          {{ 'COMMON.CANCEL' | translate }}
        </button>
        <button class="btn btn-primary" (click)="submitModal()">
          {{ 'COMMON.SUBMIT' | translate }}
        </button>
      </div>
    </div>
  </div>
}
```

```scss
@import '../../../styles/responsive';

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: var(--background-white);
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;

  @include mobile-only {
    width: 100%;
    max-width: 100%;
    border-radius: 12px;
  }

  @include respond-above('md') {
    width: 90%;
    max-width: 600px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    @include responsive-padding(1.5rem, 2rem, 2rem);
    border-bottom: 1px solid var(--border-light);

    .modal-title {
      @include responsive-font(1.25rem, 1.5rem, 1.5rem);
      font-weight: 600;
      color: var(--text-dark);
      margin: 0;
    }

    .modal-close {
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        color: var(--text-dark);
        transform: rotate(90deg);
      }
    }
  }

  .modal-body {
    @include responsive-padding(1.5rem, 2rem, 2rem);
  }

  .modal-footer {
    display: flex;
    gap: 1rem;
    @include responsive-padding(1.5rem, 2rem, 2rem);
    border-top: 1px solid var(--border-light);

    @include mobile-only {
      flex-direction: column-reverse;

      .btn {
        width: 100%;
      }
    }

    @include respond-above('md') {
      justify-content: flex-end;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## ⚡ Performance Optimization

### 1. Use TrackBy in Loops

```html
<!-- ❌ BAD -->
@for (item of items) {
  <div>{{ item.name }}</div>
}

<!-- ✅ GOOD -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

### 2. Lazy Load Heavy Components

```typescript
// Use dynamic imports for heavy components
const HeavyComponent = await import('./heavy.component');
```

### 3. Optimize Images

```html
<!-- Use ngOptimizedImage for images -->
<img ngSrc="assets/images/hero.jpg"
     width="1200"
     height="600"
     alt="Hero image"
     priority />
```

### 4. Avoid Unnecessary Change Detection

```typescript
// Use OnPush change detection strategy when possible
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

---

## ♿ Accessibility

### 1. Semantic HTML

```html
<!-- Use proper HTML elements -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<article>...</article>
<aside>...</aside>
<footer>...</footer>
```

### 2. ARIA Labels

```html
<!-- Add aria labels for screen readers -->
<button
  (click)="toggleMenu()"
  [attr.aria-label]="'HEADER.MENU' | translate"
  [attr.aria-expanded]="menuOpen()">
  Menu
</button>
```

### 3. Keyboard Navigation

```typescript
// Handle keyboard events
@HostListener('keydown.escape')
onEscape(): void {
  this.closeModal();
}

@HostListener('keydown.enter')
onEnter(): void {
  this.submit();
}
```

### 4. Focus Management

```typescript
// Manage focus for modals
@ViewChild('firstInput') firstInput!: ElementRef;

ngAfterViewInit(): void {
  this.firstInput.nativeElement.focus();
}
```

---

## 📁 Code Organization

### File Structure

```
src/app/
├── components/          # Shared components
│   ├── header/
│   ├── footer/
│   ├── theme-switcher/
│   └── language-switcher/
├── pages/               # Page components
│   ├── home/
│   ├── profile/
│   └── offers/
├── services/            # Business logic
│   ├── auth.service.ts
│   ├── theme.service.ts
│   └── responsive.service.ts
├── models/              # TypeScript interfaces/types
├── guards/              # Route guards
└── interceptors/        # HTTP interceptors
```

### Naming Conventions

- **Components**: `kebab-case.component.ts`
- **Services**: `kebab-case.service.ts`
- **Models**: `PascalCase.model.ts`
- **Signals**: `camelCase` (e.g., `isLoading`)
- **Constants**: `SCREAMING_SNAKE_CASE`

---

## ✅ Refactoring Checklist

When refactoring a page, ensure you complete these tasks:

### TypeScript
- [ ] Convert to standalone component
- [ ] Use `inject()` instead of constructor injection
- [ ] Convert all state to signals
- [ ] Use `computed()` for derived state
- [ ] Add ResponsiveService integration
- [ ] Add ThemeService if needed
- [ ] Remove unused imports

### Template (HTML)
- [ ] Replace all hardcoded text with translation pipes
- [ ] Add `track` to all `@for` loops
- [ ] Use `@if`, `@else`, `@for` syntax (not `*ngIf`, `*ngFor`)
- [ ] Add ARIA labels for accessibility
- [ ] Use semantic HTML elements

### Styles (SCSS)
- [ ] Import responsive utilities
- [ ] Replace hardcoded colors with CSS variables
- [ ] Add responsive breakpoints
- [ ] Use responsive mixins for padding/margins
- [ ] Add hover/focus states
- [ ] Test on mobile, tablet, and desktop

### Testing
- [ ] Test all breakpoints (375px, 768px, 1024px, 1440px)
- [ ] Test light and dark themes
- [ ] Test English and Arabic (RTL)
- [ ] Test loading states
- [ ] Test error states
- [ ] Test empty states

---

## 🚀 Example: Before & After

### Before (Old Pattern)

```typescript
// ❌ Old style
@Component({
  selector: 'app-offers',
  templateUrl: './offers.html',
  styleUrl: './offers.css'  // CSS file
})
export class OffersComponent implements OnInit {
  isLoading: boolean = false;
  offer: any;

  constructor(
    private route: ActivatedRoute,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    this.loadOffer();
  }
}
```

```html
<!-- ❌ Old template -->
<div *ngIf="isLoading">Loading...</div>
<div *ngIf="offer">
  <h1>Offer Details</h1>
  <button>Accept</button>
</div>
```

```css
/* ❌ Old CSS - hardcoded values */
.offer-card {
  background: #FFFFFF;
  padding: 20px;
}
```

### After (New Pattern)

```typescript
// ✅ New style
@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './offers.html',
  styleUrl: './offers.scss'  // SCSS file
})
export class OffersComponent {
  protected responsive = inject(ResponsiveService);
  private route = inject(ActivatedRoute);
  private offerService = inject(OfferService);

  protected isLoading = signal(false);
  protected offer = signal<Offer | null>(null);
  protected isMobile = computed(() => this.responsive.state().isMobile);

  constructor() {
    this.loadOffer();
  }
}
```

```html
<!-- ✅ New template -->
@if (isLoading()) {
  <div class="loading-wrapper">
    <div class="loading-spinner"></div>
    <p>{{ 'OFFERS.LOADING' | translate }}</p>
  </div>
} @else if (offer()) {
  <div class="offer-card">
    <h1>{{ 'OFFERS.TITLE' | translate }}</h1>
    <button class="btn btn-primary">
      {{ 'OFFERS.ACTIONS.ACCEPT' | translate }}
    </button>
  </div>
}
```

```scss
// ✅ New SCSS - theme-aware & responsive
@import '../../../styles/responsive';

.offer-card {
  background: var(--background-white);
  @include responsive-padding(1rem, 1.5rem, 2rem);
  border-radius: 12px;
  box-shadow: var(--shadow-md);

  @include mobile-only {
    border-radius: 8px;
  }

  h1 {
    @include responsive-font(1.5rem, 2rem, 2.5rem);
    color: var(--text-dark);
  }
}
```

---

## 📞 Need Help?

Refer to:
- [Responsive Design Guide](./RESPONSIVE_GUIDE.md)
- Existing refactored components (header, wallet)
- Angular 20 documentation

---

**Happy Refactoring! 🎉**
