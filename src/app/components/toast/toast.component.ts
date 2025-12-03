import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast toast-{{toast.type}}"
          (click)="toastService.remove(toast.id)"
        >
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <span>✓</span> }
              @case ('error') { <span>✕</span> }
              @case ('warning') { <span>⚠</span> }
              @case ('info') { <span>ℹ</span> }
            }
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" (click)="toastService.remove(toast.id)">×</button>
        </div>
      }
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 8px;
      background: var(--card-background, #fff);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 4px solid;
      min-width: 300px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast:hover {
      transform: translateX(-4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .toast-icon {
      font-size: 20px;
      font-weight: bold;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
      color: var(--text-color, #333);
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .toast-close:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    /* Success Toast */
    .toast-success {
      border-left-color: #10b981;
    }

    .toast-success .toast-icon {
      background: #d1fae5;
      color: #059669;
    }

    /* Error Toast */
    .toast-error {
      border-left-color: #ef4444;
    }

    .toast-error .toast-icon {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Warning Toast */
    .toast-warning {
      border-left-color: #f59e0b;
    }

    .toast-warning .toast-icon {
      background: #fef3c7;
      color: #d97706;
    }

    /* Info Toast */
    .toast-info {
      border-left-color: #3b82f6;
    }

    .toast-info .toast-icon {
      background: #dbeafe;
      color: #2563eb;
    }

    @media (max-width: 768px) {
      .toast-container {
        right: 16px;
        left: 16px;
        top: 16px;
        max-width: none;
      }

      .toast {
        min-width: auto;
      }
    }
  `]
})
export class ToastComponent {
    toastService = inject(ToastService);
}
