# 📱 Responsive Design System Guide

Complete guide for implementing responsive designs in the Fixit application using our custom responsive utilities and service.

---

## 📑 Table of Contents

1. [Breakpoint System](#breakpoint-system)
2. [ResponsiveService (TypeScript)](#responsiveservice-typescript)
3. [Responsive SCSS Mixins](#responsive-scss-mixins)
4. [Best Practices](#best-practices)
5. [Common Patterns](#common-patterns)
6. [Examples](#examples)

---

## 🎯 Breakpoint System

Our breakpoint system matches Tailwind CSS defaults and is consistent across TypeScript and SCSS:

| Breakpoint | Min Width | Device Type | Usage |
|------------|-----------|-------------|-------|
| **xs** | 0px | Mobile phones | Default (no media query needed) |
| **sm** | 640px | Large phones | Portrait tablets |
| **md** | 768px | Tablets | iPad, Android tablets |
| **lg** | 1024px | Small laptops | Small desktops |
| **xl** | 1280px | Laptops/Desktops | Standard monitors |
| **2xl** | 1536px | Large desktops | Ultra-wide displays |

### Device Categories

- **Mobile**: `xs` and `sm` (< 768px)
- **Tablet**: `md` (768px - 1023px)
- **Desktop**: `lg` and above (≥ 1024px)

---

## 💻 ResponsiveService (TypeScript)

### Overview

The `ResponsiveService` provides reactive breakpoint management using Angular signals.

### Installation

The service is provided in root and available globally:

```typescript
import { ResponsiveService } from '@app/services/responsive.service';

export class MyComponent {
  private responsive = inject(ResponsiveService);
}
```

### Available Properties

#### `state()` - Complete Breakpoint State

Returns a computed signal with all breakpoint information:

```typescript
const state = this.responsive.state();

// Available properties:
state.isXs        // true if screen width < 640px
state.isSm        // true if 640px ≤ width < 768px
state.isMd        // true if 768px ≤ width < 1024px
state.isLg        // true if 1024px ≤ width < 1280px
state.isXl        // true if 1280px ≤ width < 1536px
state.is2xl       // true if width ≥ 1536px

state.isMobile    // true if width < 768px
state.isTablet    // true if 768px ≤ width < 1024px
state.isDesktop   // true if width ≥ 1024px

state.currentBreakpoint  // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
state.screenWidth        // Current width in pixels
```

### Available Methods

#### `is(breakpoint)` - Check Exact Breakpoint

```typescript
if (this.responsive.is('md')) {
  // Currently on tablet
}
```

#### `isAtLeast(breakpoint)` - Check Minimum Breakpoint

```typescript
if (this.responsive.isAtLeast('lg')) {
  // Desktop and up (lg, xl, 2xl)
}
```

#### `isAtMost(breakpoint)` - Check Maximum Breakpoint

```typescript
if (this.responsive.isAtMost('sm')) {
  // Mobile only (xs, sm)
}
```

#### `getBreakpointName(breakpoint?)` - Get Readable Name

```typescript
const name = this.responsive.getBreakpointName();
// Returns: "Large (Laptop)" if current breakpoint is 'lg'
```

### Component Examples

#### Example 1: Conditional Rendering in Template

```typescript
import { Component, inject } from '@angular/core';
import { ResponsiveService } from '@app/services/responsive.service';

@Component({
  template: `
    <!-- Show mobile menu on small screens -->
    @if (responsive.state().isMobile) {
      <app-mobile-menu></app-mobile-menu>
    } @else {
      <app-desktop-nav></app-desktop-nav>
    }

    <!-- Show different layouts per breakpoint -->
    @if (responsive.state().isDesktop) {
      <div class="grid grid-cols-3">...</div>
    } @else if (responsive.state().isTablet) {
      <div class="grid grid-cols-2">...</div>
    } @else {
      <div class="grid grid-cols-1">...</div>
    }
  `
})
export class MyComponent {
  protected responsive = inject(ResponsiveService);
}
```

#### Example 2: Computed Properties Based on Breakpoint

```typescript
export class DashboardComponent {
  private responsive = inject(ResponsiveService);

  // Computed number of columns based on screen size
  protected columns = computed(() => {
    const state = this.responsive.state();
    if (state.isDesktop) return 4;
    if (state.isTablet) return 2;
    return 1;
  });

  // Computed sidebar visibility
  protected showSidebar = computed(() =>
    this.responsive.state().isDesktop
  );
}
```

#### Example 3: Reactive UI Adjustments

```typescript
export class GalleryComponent {
  private responsive = inject(ResponsiveService);

  // Adjust items per page based on screen size
  protected itemsPerPage = computed(() => {
    const state = this.responsive.state();
    if (state.is2xl) return 24;
    if (state.isXl) return 18;
    if (state.isLg) return 12;
    if (state.isMd) return 8;
    return 6;
  });

  // Use in effect for side effects
  constructor() {
    effect(() => {
      const breakpoint = this.responsive.state().currentBreakpoint;
      console.log(`Breakpoint changed to: ${breakpoint}`);
    });
  }
}
```

---

## 🎨 Responsive SCSS Mixins

### Installation

Import the responsive utilities in your component SCSS:

```scss
@import '../../../styles/responsive';
```

### Core Mixins

#### 1. `respond-above($breakpoint)` - Mobile-First

Apply styles from a breakpoint and up:

```scss
.my-component {
  padding: 1rem;

  @include respond-above('md') {
    padding: 2rem;
  }

  @include respond-above('lg') {
    padding: 3rem;
  }
}
```

#### 2. `respond-below($breakpoint)` - Desktop-First

Apply styles up to a breakpoint:

```scss
.desktop-sidebar {
  display: block;

  @include respond-below('lg') {
    display: none;
  }
}
```

#### 3. `respond-between($min, $max)` - Range

Apply styles within a breakpoint range:

```scss
.tablet-layout {
  @include respond-between('md', 'lg') {
    display: flex;
    justify-content: space-between;
  }
}
```

### Convenience Mixins

#### Device-Specific Mixins

```scss
// Mobile only (< 768px)
@include mobile-only {
  flex-direction: column;
}

// Tablet only (768px - 1023px)
@include tablet-only {
  grid-template-columns: repeat(2, 1fr);
}

// Desktop and up (≥ 1024px)
@include desktop {
  grid-template-columns: repeat(4, 1fr);
}
```

### Layout Mixins

#### Responsive Grid

```scss
.my-grid {
  // 1 column on mobile, 2 on tablet, 4 on desktop
  @include responsive-grid(1, 2, 4);
}
```

#### Responsive Container

```scss
.container {
  @include responsive-container;
}
```

#### Responsive Padding & Margin

```scss
.my-section {
  @include responsive-padding(1rem, 2rem, 3rem);
  @include responsive-margin(0.5rem, 1rem, 1.5rem);
}
```

#### Responsive Typography

```scss
.heading {
  @include responsive-font(1.5rem, 2rem, 2.5rem);
}
```

### Visibility Mixins

```scss
// Hide on mobile
.desktop-only {
  @include hide-mobile;
}

// Show only on mobile
.mobile-banner {
  @include show-mobile-only;
}

// Hide on tablet
.skip-tablet {
  @include hide-tablet;
}

// Hide on desktop
.mobile-feature {
  @include hide-desktop;
}
```

---

## ✅ Best Practices

### 1. Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```scss
// ✅ Good - Mobile first
.card {
  padding: 1rem;

  @include respond-above('md') {
    padding: 2rem;
  }
}

// ❌ Avoid - Desktop first
.card {
  padding: 3rem;

  @include respond-below('md') {
    padding: 1rem;
  }
}
```

### 2. Use Semantic Breakpoints

Choose breakpoints based on content, not devices:

```scss
// ✅ Good - Content-based
.navigation {
  @include mobile-only {
    // Mobile menu
  }

  @include desktop {
    // Full navigation
  }
}
```

### 3. Combine TypeScript and SCSS

Use ResponsiveService for logic, SCSS for styling:

```typescript
// TypeScript - Handle logic
protected showAdvancedFilters = computed(() =>
  this.responsive.state().isDesktop
);
```

```scss
// SCSS - Handle styling
.filters {
  @include mobile-only {
    position: fixed;
    bottom: 0;
  }
}
```

### 4. Test All Breakpoints

Always test your components at these widths:
- 375px (iPhone)
- 768px (iPad portrait)
- 1024px (iPad landscape)
- 1440px (Desktop)

### 5. Avoid Fixed Widths

Use relative units and flexible layouts:

```scss
// ✅ Good
.card {
  width: 100%;
  max-width: 400px;
}

// ❌ Avoid
.card {
  width: 400px;
}
```

---

## 🔥 Common Patterns

### Pattern 1: Responsive Navigation

```typescript
@Component({
  template: `
    @if (responsive.state().isMobile) {
      <button (click)="toggleMenu()">
        <svg>...</svg>
      </button>
      <app-mobile-menu [open]="menuOpen()"></app-mobile-menu>
    } @else {
      <nav class="desktop-nav">...</nav>
    }
  `
})
export class HeaderComponent {
  protected responsive = inject(ResponsiveService);
  protected menuOpen = signal(false);
}
```

```scss
.desktop-nav {
  @include hide-mobile;
  display: flex;
  gap: 2rem;
}
```

### Pattern 2: Responsive Card Grid

```scss
.card-grid {
  @include responsive-grid(1, 2, 3);
  gap: 1.5rem;

  @include respond-above('2xl') {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Pattern 3: Responsive Modal

```typescript
protected modalSize = computed(() => {
  const state = this.responsive.state();
  if (state.isMobile) return 'full';
  if (state.isTablet) return 'large';
  return 'medium';
});
```

```scss
.modal {
  @include mobile-only {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  @include respond-above('md') {
    width: 90%;
    max-width: 600px;
    border-radius: 12px;
  }
}
```

### Pattern 4: Responsive Typography

```scss
.hero-title {
  @include responsive-font(2rem, 3rem, 4rem);
  line-height: 1.2;

  @include mobile-only {
    text-align: center;
  }
}
```

### Pattern 5: Sidebar Layout

```scss
.layout {
  display: flex;

  @include mobile-only {
    flex-direction: column;
  }

  .sidebar {
    @include mobile-only {
      width: 100%;
      order: 2;
    }

    @include desktop {
      width: 300px;
      order: 1;
    }
  }

  .content {
    flex: 1;

    @include mobile-only {
      order: 1;
    }
  }
}
```

---

## 📚 Complete Examples

### Example 1: Dashboard Component

```typescript
import { Component, inject, computed } from '@angular/core';
import { ResponsiveService } from '@app/services/responsive.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <!-- Sidebar - only on desktop -->
      @if (showSidebar()) {
        <aside class="sidebar">
          <app-navigation></app-navigation>
        </aside>
      }

      <main class="content">
        <div class="grid" [attr.data-cols]="gridColumns()">
          @for (card of cards; track card.id) {
            <app-card [data]="card"></app-card>
          }
        </div>
      </main>

      <!-- Mobile bottom nav -->
      @if (showBottomNav()) {
        <app-mobile-nav></app-mobile-nav>
      }
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  protected responsive = inject(ResponsiveService);

  protected showSidebar = computed(() =>
    this.responsive.state().isDesktop
  );

  protected showBottomNav = computed(() =>
    this.responsive.state().isMobile
  );

  protected gridColumns = computed(() => {
    const state = this.responsive.state();
    if (state.is2xl) return 4;
    if (state.isXl) return 3;
    if (state.isLg) return 3;
    if (state.isMd) return 2;
    return 1;
  });

  cards = [/* ... */];
}
```

```scss
@import '../../../styles/responsive';

.dashboard {
  display: flex;
  min-height: 100vh;

  @include mobile-only {
    flex-direction: column;
  }

  .sidebar {
    @include hide-mobile;
    width: 280px;
    background: var(--background-light);
    padding: 2rem 1rem;
  }

  .content {
    flex: 1;
    @include responsive-padding(1rem, 2rem, 3rem);
  }

  .grid {
    display: grid;
    gap: 1.5rem;

    &[data-cols="1"] {
      grid-template-columns: 1fr;
    }

    &[data-cols="2"] {
      grid-template-columns: repeat(2, 1fr);
    }

    &[data-cols="3"] {
      grid-template-columns: repeat(3, 1fr);
    }

    &[data-cols="4"] {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}
```

### Example 2: Product Card

```typescript
@Component({
  selector: 'app-product-card',
  template: `
    <article class="product-card" [class.compact]="isCompact()">
      <img [src]="product.image" [alt]="product.name" />

      <div class="content">
        <h3 class="title">{{ product.name }}</h3>

        @if (!isCompact()) {
          <p class="description">{{ product.description }}</p>
        }

        <div class="footer">
          <span class="price">{{ product.price | currency }}</span>
          <button class="btn">
            {{ isCompact() ? 'Buy' : 'Add to Cart' }}
          </button>
        </div>
      </div>
    </article>
  `
})
export class ProductCardComponent {
  @Input() product!: Product;

  protected responsive = inject(ResponsiveService);

  protected isCompact = computed(() =>
    this.responsive.state().isMobile
  );
}
```

```scss
@import '../../../styles/responsive';

.product-card {
  background: var(--background-white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;

  @include respond-above('md') {
    display: flex;

    img {
      width: 200px;
      height: 200px;
    }
  }

  @include mobile-only {
    img {
      width: 100%;
      height: 250px;
    }
  }

  .content {
    @include responsive-padding(1rem, 1.5rem, 2rem);
    flex: 1;
  }

  .title {
    @include responsive-font(1.125rem, 1.25rem, 1.5rem);
    margin-bottom: 0.5rem;
  }

  &.compact {
    .title {
      font-size: 1rem;
    }

    .footer {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
}
```

---

## 🚀 Quick Reference

### TypeScript

```typescript
protected responsive = inject(ResponsiveService);

// Get state
this.responsive.state().isMobile
this.responsive.state().isDesktop
this.responsive.state().currentBreakpoint

// Check breakpoint
this.responsive.is('lg')
this.responsive.isAtLeast('md')
this.responsive.isAtMost('sm')
```

### SCSS

```scss
@import '../../../styles/responsive';

// Breakpoint mixins
@include respond-above('md') { }
@include respond-below('lg') { }
@include respond-between('md', 'lg') { }

// Device mixins
@include mobile-only { }
@include tablet-only { }
@include desktop { }

// Layout mixins
@include responsive-grid(1, 2, 4);
@include responsive-padding(1rem, 2rem, 3rem);
@include responsive-font(14px, 16px, 18px);

// Visibility mixins
@include hide-mobile;
@include show-mobile-only;
```

---

## 📞 Support

For questions or issues with the responsive system:
1. Review this guide
2. Check existing component implementations
3. Test at all breakpoints
4. Consult with the development team

---

**Happy Responsive Coding! 📱💻🖥️**
