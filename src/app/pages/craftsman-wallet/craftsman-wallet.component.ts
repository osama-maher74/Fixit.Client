import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { WalletDto, WalletTransactionDto, TransactionType } from '../../models/wallet.models';
import { CraftsmanProfile } from '../../models/craftsman.models';

@Component({
  selector: 'app-craftsman-wallet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './craftsman-wallet.component.html',
  styleUrl: './craftsman-wallet.component.scss'
})
export class CraftsmanWalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private craftsmanService = inject(CraftsmanService);
  private router = inject(Router);

  // Signals for reactive state
  wallet = signal<WalletDto | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Expose enum to template
  TransactionType = TransactionType;

  ngOnInit(): void {
    this.loadCraftsmanProfileAndWallet();
  }

  /**
   * Load craftsman profile first, then wallet data using the ID from backend
   */
  private loadCraftsmanProfileAndWallet(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // First, get the craftsman profile to get the ID from backend
    this.craftsmanService.getCurrentUserProfile().subscribe({
      next: (profile: CraftsmanProfile) => {
        console.log('Craftsman profile loaded, ID:', profile.id);

        // Now load wallet using the ID from backend
        this.loadWallet(profile.id);
      },
      error: (error: any) => {
        console.error('Error loading craftsman profile:', error);
        this.errorMessage.set('Failed to load profile. Please login again.');
        this.isLoading.set(false);

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }

  /**
   * Load wallet data using craftsman ID from backend
   */
  private loadWallet(craftsmanId: number): void {
    this.walletService.getWalletByCraftsmanId(craftsmanId).subscribe({
      next: (data: WalletDto) => {
        console.log('Wallet data loaded:', data);
        this.wallet.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading wallet:', error);
        this.errorMessage.set(error.error?.message || 'Failed to load wallet data');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Retry loading wallet
   */
  retryLoad(): void {
    this.loadCraftsmanProfileAndWallet();
  }

  /**
   * Get transaction type display text
   */
  getTransactionTypeText(type: TransactionType): string {
    switch (type) {
      case TransactionType.Deposit:
        return 'Deposit';
      case TransactionType.Withdrawal:
        return 'Withdrawal';
      case TransactionType.Payment:
        return 'Payment';
      case TransactionType.Refund:
        return 'Refund';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get transaction type icon
   */
  getTransactionIcon(type: TransactionType): string {
    switch (type) {
      case TransactionType.Deposit:
      case TransactionType.Refund:
        return 'arrow-down';
      case TransactionType.Withdrawal:
      case TransactionType.Payment:
        return 'arrow-up';
      default:
        return 'arrow-right';
    }
  }

  /**
   * Check if transaction is positive (adds money)
   */
  isPositiveTransaction(type: TransactionType): boolean {
    return type === TransactionType.Deposit || type === TransactionType.Refund;
  }

  /**
   * Format transaction date
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Navigate back to profile
   */
  goBack(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Get sorted transactions (newest first)
   */
  getSortedTransactions(): WalletTransactionDto[] {
    const transactions = this.wallet()?.transactions || [];
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }
}
