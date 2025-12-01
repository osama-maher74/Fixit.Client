import { Injectable, inject, NgZone } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event } from '@angular/router';
import { LoadingService } from './loading.service';

/**
 * AGGRESSIVE Navigation Loading Service
 * Prevents error pages from EVER showing during navigation
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationLoadingService {
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private ngZone = inject(NgZone);

  // Track navigation state
  private isNavigating = false;
  private navigationStartTime = 0;

  // CRITICAL: Minimum loading time to COMPLETELY prevent error page flashing
  private readonly MIN_LOADING_TIME = 500;

  // Maximum time to keep loading active before forcing redirect
  private readonly MAX_LOADING_TIME = 8000;

  // Timeout reference for cleanup
  private loadingTimeout: any = null;

  initialize(): void {
    console.log('🚀 Initializing AGGRESSIVE navigation loading...');

    this.router.events.subscribe((event: Event) => {
      this.handleNavigationEvent(event);
    });
  }

  private handleNavigationEvent(event: Event): void {
    if (event instanceof NavigationStart) {
      this.onNavigationStart(event);
    } else if (event instanceof NavigationEnd) {
      this.onNavigationEnd(event);
    } else if (event instanceof NavigationCancel) {
      this.onNavigationCancel(event);
    } else if (event instanceof NavigationError) {
      this.onNavigationError(event);
    }
  }

  private onNavigationStart(event: NavigationStart): void {
    console.log('🔵 Navigation Started:', event.url);

    this.isNavigating = true;
    this.navigationStartTime = Date.now();

    // Clear any existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    // IMMEDIATELY show loading
    this.ngZone.run(() => {
      this.loadingService.show();
    });

    // Set maximum loading timeout
    this.loadingTimeout = setTimeout(() => {
      console.warn('⏱️ MAX navigation timeout reached - forcing redirect to home');
      this.forceEndNavigation(true);
    }, this.MAX_LOADING_TIME);
  }

  private onNavigationEnd(event: NavigationEnd): void {
    console.log('✅ Navigation Ended:', event.url);

    this.isNavigating = false;

    // Calculate elapsed time
    const elapsedTime = Date.now() - this.navigationStartTime;
    const remainingTime = Math.max(0, this.MIN_LOADING_TIME - elapsedTime);

    console.log(`⏱️ Navigation took ${elapsedTime}ms, showing loading for at least ${this.MIN_LOADING_TIME}ms`);

    // Ensure minimum loading time to prevent ANY error flashing
    setTimeout(() => {
      this.ngZone.run(() => {
        this.loadingService.hide();
        console.log('✅ Loading hidden after navigation success');
      });

      // Clear timeout
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
    }, remainingTime);
  }

  private onNavigationCancel(event: NavigationCancel): void {
    console.warn('⚠️ Navigation Cancelled:', event.url, event.reason);

    this.isNavigating = false;

    // KEEP loading active for a moment in case of retry
    // This prevents error pages from showing during cancellation
    setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.isNavigating) {
          this.loadingService.hide();
          console.log('✅ Loading hidden after navigation cancel');
        }
      });
    }, 1000);
  }

  private onNavigationError(event: NavigationError): void {
    console.error('❌ Navigation Error:', event.url);
    console.error('Error details:', event.error);

    this.isNavigating = false;

    // CRITICAL: DO NOT hide loading - keep it active to prevent error page
    console.log('🛡️ KEEPING loading active to prevent error page from showing');
    console.log('Will redirect to home after timeout...');

    // Set timeout to redirect to home page
    setTimeout(() => {
      this.ngZone.run(() => {
        console.warn('⏱️ Navigation error timeout - redirecting to home');
        this.forceEndNavigation(true);
      });
    }, 2000);
  }

  private forceEndNavigation(redirectToHome: boolean = false): void {
    console.log('🔄 Force ending navigation...');

    this.isNavigating = false;

    if (redirectToHome) {
      // Navigate to home and hide loading
      this.router.navigate(['/'], { replaceUrl: true }).then(() => {
        this.ngZone.run(() => {
          this.loadingService.forceHide();
          console.log('✅ Redirected to home and loading hidden');
        });
      }).catch(() => {
        // If navigation fails, just hide loading
        this.ngZone.run(() => {
          this.loadingService.forceHide();
          console.log('✅ Navigation failed, loading hidden');
        });
      });
    } else {
      this.ngZone.run(() => {
        this.loadingService.forceHide();
        console.log('✅ Loading force hidden');
      });
    }

    // Clear timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }

  isCurrentlyNavigating(): boolean {
    return this.isNavigating;
  }
}
