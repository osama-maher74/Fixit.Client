# Global Loading State Integration Guide

This guide explains how to integrate the global loading state system into your Angular 20 application.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Step-by-Step Integration](#step-by-step-integration)
3. [Component-Level Usage](#component-level-usage)
4. [Advanced Scenarios](#advanced-scenarios)
5. [Troubleshooting](#troubleshooting)

---

## Overview

The global loading state system consists of:
- **LoadingService**: Manages the loading state
- **LoadingInterceptor**: Automatically intercepts HTTP requests
- **LoadingComponent**: Displays the loading indicator

---

## Step-by-Step Integration

### Step 1: Register the HTTP Interceptor

**Option A: Using `app.config.ts` (Modern Angular 20 approach)**

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
};
```

**Option B: Using `main.ts` (Alternative approach)**

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoadingInterceptor } from './app/interceptors/loading.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
});
```

---

### Step 2: Add Loading Component to App Component

**Update `src/app/app.component.ts`:**

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './components/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Fixit.Client';
}
```

**Update `src/app/app.component.html`:**

```html
<!-- Add the loading component at the top level -->
<app-loading></app-loading>

<!-- Your existing router outlet and content -->
<router-outlet></router-outlet>
```

---

## Component-Level Usage

### Basic HTTP Request (Automatic Loading)

The interceptor handles this automatically:

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  users: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Loading indicator shows automatically
    this.http.get('/api/users').subscribe({
      next: (data: any) => {
        this.users = data;
        // Loading indicator hides automatically
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Loading indicator hides automatically even on error
      }
    });
  }
}
```

### Manual Loading Control

For non-HTTP operations or custom control:

```typescript
import { Component } from '@angular/core';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-custom-operation',
  templateUrl: './custom-operation.component.html'
})
export class CustomOperationComponent {
  constructor(private loadingService: LoadingService) {}

  async performHeavyOperation() {
    // Manually show loading
    this.loadingService.show();

    try {
      // Your heavy operation
      await this.processData();
      console.log('Operation completed');
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      // Always hide loading
      this.loadingService.hide();
    }
  }

  private async processData(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 3000);
    });
  }
}
```

### Local Loading State (Component-Specific)

For component-specific loading indicators:

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html'
})
export class OffersComponent implements OnInit {
  offers: any[] = [];
  localLoading = false; // Component-specific loading state

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadOffers();
  }

  loadOffers() {
    this.localLoading = true;

    this.http.get('/api/offers').subscribe({
      next: (data: any) => {
        this.offers = data;
        this.localLoading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.localLoading = false;
      }
    });
  }
}
```

**Template with local loading:**

```html
<div class="offers-container">
  <!-- Local loading state -->
  <div *ngIf="localLoading" class="local-spinner">
    <div class="spinner"></div>
    <p>Loading offers...</p>
  </div>

  <!-- Content -->
  <div *ngIf="!localLoading">
    <div *ngFor="let offer of offers">
      {{ offer.name }}
    </div>
  </div>
</div>
```

---

## Advanced Scenarios

### Excluding Specific URLs from Global Loading

Update `src/app/interceptors/loading.interceptor.ts`:

```typescript
private readonly EXCLUDED_URLS: string[] = [
  '/api/health-check',
  '/api/ping',
  '/api/real-time-updates'
];
```

### Checking Loading State in Components

```typescript
import { Component } from '@angular/core';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  constructor(public loadingService: LoadingService) {}

  canNavigate(): boolean {
    // Prevent navigation while loading
    return !this.loadingService.isLoading();
  }
}
```

### Force Hide Loading (Error Recovery)

```typescript
import { Component } from '@angular/core';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-error-handler',
  templateUrl: './error-handler.component.html'
})
export class ErrorHandlerComponent {
  constructor(private loadingService: LoadingService) {}

  handleCriticalError() {
    // Force hide loading if something goes wrong
    this.loadingService.forceHide();

    // Show error message to user
    alert('An error occurred. Please refresh the page.');
  }
}
```

### Observable-Based Loading State

```typescript
import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-status-bar',
  template: `
    <div class="status-bar">
      <span *ngIf="isLoading$ | async">⏳ Loading...</span>
      <span *ngIf="!(isLoading$ | async)">✅ Ready</span>
    </div>
  `
})
export class StatusBarComponent implements OnInit {
  isLoading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.loading$;
  }

  ngOnInit() {}
}
```

---

## Troubleshooting

### Issue: Loading indicator doesn't show

**Solution:**
1. Verify the interceptor is registered in `app.config.ts`
2. Check that `<app-loading>` is in `app.component.html`
3. Ensure you're using `HttpClient` for HTTP requests

### Issue: Loading indicator doesn't hide

**Solution:**
1. Check for unhandled errors in HTTP requests
2. Use `loadingService.forceHide()` as a safety measure
3. Verify all HTTP calls have proper error handling

### Issue: Multiple loading indicators

**Solution:**
The service uses a request counter to handle multiple simultaneous requests. This is working as intended.

### Issue: Loading shows for very fast requests

**Solution:**
Add a minimum delay in the interceptor:

```typescript
finalize(() => {
  if (shouldShowLoading) {
    // Add 300ms minimum delay for better UX
    setTimeout(() => this.loadingService.hide(), 300);
  }
})
```

---

## Best Practices

1. **Use global loading for HTTP requests** - Let the interceptor handle it automatically
2. **Use local loading for component-specific operations** - Heavy computations, file uploads, etc.
3. **Always handle errors** - Ensure loading state is cleared even on errors
4. **Exclude polling/real-time URLs** - Add them to the exclusion list
5. **Test with slow network** - Use browser DevTools to simulate slow 3G

---

## Next Steps

1. ✅ Register the interceptor
2. ✅ Add loading component to app
3. ✅ Test with existing HTTP calls
4. ✅ Add error handling to all components
5. ✅ Customize the loading UI to match your theme

---

**Need Help?** Check the Angular documentation or review the code comments in the service and interceptor files.
