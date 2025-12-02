import { Injectable, signal, computed } from '@angular/core';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointState {
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  currentBreakpoint: Breakpoint;
  screenWidth: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {
  // Breakpoint definitions (matching Tailwind CSS)
  private readonly breakpoints = {
    xs: 0,      // 0px - 639px (Mobile phones)
    sm: 640,    // 640px - 767px (Large phones)
    md: 768,    // 768px - 1023px (Tablets)
    lg: 1024,   // 1024px - 1279px (Small laptops)
    xl: 1280,   // 1280px - 1535px (Laptops/Desktops)
    '2xl': 1536 // 1536px+ (Large desktops/Ultra-wide)
  };

  // Reactive signal for screen width
  private screenWidth = signal<number>(this.getScreenWidth());

  // Computed signals for breakpoints
  public readonly state = computed<BreakpointState>(() => {
    const width = this.screenWidth();

    return {
      isXs: width < this.breakpoints.sm,
      isSm: width >= this.breakpoints.sm && width < this.breakpoints.md,
      isMd: width >= this.breakpoints.md && width < this.breakpoints.lg,
      isLg: width >= this.breakpoints.lg && width < this.breakpoints.xl,
      isXl: width >= this.breakpoints.xl && width < this.breakpoints['2xl'],
      is2xl: width >= this.breakpoints['2xl'],
      isMobile: width < this.breakpoints.md,
      isTablet: width >= this.breakpoints.md && width < this.breakpoints.lg,
      isDesktop: width >= this.breakpoints.lg,
      currentBreakpoint: this.getCurrentBreakpoint(width),
      screenWidth: width
    };
  });

  constructor() {
    // Listen to window resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.screenWidth.set(this.getScreenWidth());
      });

      // Listen to orientation changes (mobile devices)
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.screenWidth.set(this.getScreenWidth());
        }, 100); // Small delay to get accurate dimensions after rotation
      });
    }
  }

  /**
   * Get current screen width
   */
  private getScreenWidth(): number {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024; // Default for SSR
  }

  /**
   * Determine current breakpoint based on width
   */
  private getCurrentBreakpoint(width: number): Breakpoint {
    if (width >= this.breakpoints['2xl']) return '2xl';
    if (width >= this.breakpoints.xl) return 'xl';
    if (width >= this.breakpoints.lg) return 'lg';
    if (width >= this.breakpoints.md) return 'md';
    if (width >= this.breakpoints.sm) return 'sm';
    return 'xs';
  }

  /**
   * Check if current screen matches a specific breakpoint
   */
  is(breakpoint: Breakpoint): boolean {
    return this.state().currentBreakpoint === breakpoint;
  }

  /**
   * Check if current screen is at least a specific breakpoint
   */
  isAtLeast(breakpoint: Breakpoint): boolean {
    const current = this.state().screenWidth;
    return current >= this.breakpoints[breakpoint];
  }

  /**
   * Check if current screen is at most a specific breakpoint
   */
  isAtMost(breakpoint: Breakpoint): boolean {
    const current = this.state().screenWidth;
    const nextBreakpoint = this.getNextBreakpoint(breakpoint);
    return nextBreakpoint ? current < this.breakpoints[nextBreakpoint] : true;
  }

  /**
   * Get next breakpoint
   */
  private getNextBreakpoint(breakpoint: Breakpoint): Breakpoint | null {
    const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = order.indexOf(breakpoint);
    return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
  }

  /**
   * Get readable breakpoint name
   */
  getBreakpointName(breakpoint?: Breakpoint): string {
    const bp = breakpoint || this.state().currentBreakpoint;
    const names: Record<Breakpoint, string> = {
      xs: 'Extra Small (Mobile)',
      sm: 'Small (Large Mobile)',
      md: 'Medium (Tablet)',
      lg: 'Large (Laptop)',
      xl: 'Extra Large (Desktop)',
      '2xl': 'Ultra Wide (Large Desktop)'
    };
    return names[bp];
  }
}
