import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  /**
   * Observable that emits the current loading state
   */
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() {}

  /**
   * Show the global loading indicator
   * Uses a counter to handle multiple simultaneous requests
   */
  show(): void {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Hide the global loading indicator
   * Only hides when all requests are complete
   */
  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Force hide the loading indicator
   * Useful for error recovery
   */
  forceHide(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Get the current loading state synchronously
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
