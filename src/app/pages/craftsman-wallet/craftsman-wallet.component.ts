import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { WalletService } from '../../services/wallet.service';
import { CraftsmanService } from '../../services/craftsman.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { WalletDto, WalletTransactionDto, TransactionType, TransactionMethod, CreateWalletTransactionDto, UpdateWalletTransactionDto } from '../../models/wallet.models';
import { CraftsmanProfile } from '../../models/craftsman.models';
import { ThemeService } from '../../services/theme.service';
import { getSwalThemeConfig } from '../../helpers/swal-theme.helper';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-craftsman-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './craftsman-wallet.component.html',
  styleUrl: './craftsman-wallet.component.scss'
})
export class CraftsmanWalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private craftsmanService = inject(CraftsmanService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private themeService = inject(ThemeService);
  translationService = inject(TranslationService);

  // Signals for reactive state
  wallet = signal<WalletDto | null>(null);
  transactions = signal<WalletTransactionDto[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  currentCraftsmanId = signal<number | null>(null);
  isAdminView = signal<boolean>(false);
  isUpdatingTransaction = signal<number | null>(null);

  // Withdrawal modal state
  showWithdrawalModal = signal<boolean>(false);
  isWithdrawing = signal<boolean>(false);
  withdrawalSuccess = signal<boolean>(false);
  withdrawalError = signal<string | null>(null);

  // Withdrawal form data
  withdrawalAmount = signal<number | null>(null);
  selectedTransactionType = signal<TransactionType | null>(null);
  withdrawalMethodInfo = signal<string>('');

  // Expose enums to template
  TransactionType = TransactionType;
  TransactionMethod = TransactionMethod;

  ngOnInit(): void {
    // Check if user is an admin
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'Admin';

    // Check if there's a craftsman ID in the route
    const routeCraftsmanId = this.route.snapshot.paramMap.get('id');

    console.log('CraftsmanWallet ngOnInit - isAdmin:', isAdmin, 'routeCraftsmanId:', routeCraftsmanId);

    if (isAdmin && routeCraftsmanId) {
      // Admin viewing a specific craftsman's wallet
      console.log('Setting isAdminView to true');
      this.isAdminView.set(true);
      const craftsmanId = +routeCraftsmanId;
      this.currentCraftsmanId.set(craftsmanId);
      this.loadWallet(craftsmanId);
      this.loadTransactions(craftsmanId);
    } else if (isAdmin && !routeCraftsmanId) {
      // Admin without ID - redirect to dashboard
      this.errorMessage.set('Please select a craftsman from the dashboard.');
      this.isLoading.set(false);
      setTimeout(() => {
        this.router.navigate(['/admin/dashboard']);
      }, 2000);
    } else if (!isAdmin && routeCraftsmanId) {
      // Craftsman with ID in route (from "My Wallet" button)
      console.log('Setting isAdminView to false - craftsman view');
      this.isAdminView.set(false);
      const craftsmanId = +routeCraftsmanId;
      this.currentCraftsmanId.set(craftsmanId);
      this.loadWallet(craftsmanId);
      this.loadTransactions(craftsmanId);
    } else {
      // Craftsman without ID - should not happen, but fallback to loading profile
      console.log('Setting isAdminView to false - fallback to profile');
      this.isAdminView.set(false);
      this.loadCraftsmanProfileAndWallet();
    }
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
        this.currentCraftsmanId.set(profile.id);

        // Now load wallet and transactions using the ID from backend
        this.loadWallet(profile.id);
        this.loadTransactions(profile.id);
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
   * Load transactions using craftsman ID
   */
  private loadTransactions(craftsmanId: number): void {
    this.walletService.getWalletTransactions(craftsmanId).subscribe({
      next: (data: WalletTransactionDto[]) => {
        console.log('Transactions loaded:', data);
        // Log each transaction's method to debug
        data.forEach((tx, index) => {
          console.log(`Transaction ${index}: method=${tx.transactionmethod}, type=${tx.transactiontype}`);
        });
        this.transactions.set(data);
      },
      error: (error: any) => {
        console.error('Error loading transactions:', error);
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
   * Navigate back to appropriate page based on view mode
   */
  goBack(): void {
    if (this.isAdminView()) {
      // Admin view - go back to craftsman details
      const craftsmanId = this.currentCraftsmanId();
      if (craftsmanId) {
        this.router.navigate(['/admin/craftsman', craftsmanId]);
      } else {
        this.router.navigate(['/admin/dashboard']);
      }
    } else {
      // User view - go back to profile
      this.router.navigate(['/profile']);
    }
  }

  /**
   * Get sorted transactions (newest first)
   */
  getSortedTransactions(): WalletTransactionDto[] {
    const txs = this.transactions();
    return [...txs].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  /**
   * Open withdrawal modal
   */
  openWithdrawalModal(): void {
    this.showWithdrawalModal.set(true);
    this.withdrawalSuccess.set(false);
    this.withdrawalError.set(null);
    this.resetWithdrawalForm();
  }

  /**
   * Close withdrawal modal
   */
  closeWithdrawalModal(): void {
    this.showWithdrawalModal.set(false);
    this.resetWithdrawalForm();
  }

  /**
   * Reset withdrawal form
   */
  private resetWithdrawalForm(): void {
    this.withdrawalAmount.set(null);
    this.selectedTransactionType.set(null);
    this.withdrawalMethodInfo.set('');
  }

  /**
   * Get withdrawal method placeholder text
   */
  getWithdrawalMethodPlaceholder(): string {
    const method = this.selectedTransactionType();
    if (method === TransactionType.Instapay) {
      return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.INSTAPAY_PLACEHOLDER');
    } else if (method === TransactionType.Ewallet) {
      return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.EWALLET_PLACEHOLDER');
    } else if (method === TransactionType.Credit) {
      return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.CREDIT_PLACEHOLDER');
    }
    return '';
  }

  /**
   * Get withdrawal method label
   */
  getWithdrawalMethodLabel(): string {
    const method = this.selectedTransactionType();
    if (method === TransactionType.Instapay) {
      return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.INSTAPAY_LABEL');
    } else if (method === TransactionType.Ewallet) {
      return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.EWALLET_LABEL');
    } else if (method === TransactionType.Credit) {
      return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.CREDIT_LABEL');
    }
    return '';
  }

  /**
   * Validate withdrawal form
   */
  isWithdrawalFormValid(): boolean {
    const amount = this.withdrawalAmount();
    const method = this.selectedTransactionType();
    const info = this.withdrawalMethodInfo();
    const balance = this.wallet()?.balance || 0;

    return (
      amount !== null &&
      amount > 0 &&
      amount <= balance &&
      method !== null &&
      info.trim().length > 0
    );
  }

  /**
   * Submit withdrawal request
   */
  submitWithdrawal(): void {
    if (!this.isWithdrawalFormValid()) {
      this.withdrawalError.set(this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.INVALID_FORM'));
      return;
    }

    const craftsmanId = this.currentCraftsmanId();
    const walletId = this.wallet()?.id;

    if (!craftsmanId || !walletId) {
      this.withdrawalError.set(this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.ERROR_MISSING_INFO'));
      return;
    }

    const dto: CreateWalletTransactionDto = {
      craftsManId: craftsmanId,
      walletId: walletId,
      amount: this.withdrawalAmount()!,
      transactionmethod: TransactionMethod.Withdraw,
      transactiontype: this.selectedTransactionType()!,
      transationInfo: this.withdrawalMethodInfo(),
      createdAt: new Date()
    };

    this.isWithdrawing.set(true);
    this.withdrawalError.set(null);

    this.walletService.withdrawFunds(dto).subscribe({
      next: (response) => {
        console.log('Withdrawal successful:', response);
        this.isWithdrawing.set(false);
        this.withdrawalSuccess.set(true);

        // Reload wallet and transactions
        if (craftsmanId) {
          this.loadWallet(craftsmanId);
          this.loadTransactions(craftsmanId);
        }
      },
      error: (error: any) => {
        console.error('Withdrawal failed:', error);
        this.isWithdrawing.set(false);
        this.withdrawalError.set(
          error.error?.message || this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.ERROR_GENERIC')
        );
      }
    });
  }

  /**
   * Get transaction type text (Instapay, E-wallet, Credit)
   */
  getTransactionTypeText(type: TransactionType): string {
    switch (type) {
      case TransactionType.Instapay:
        return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.METHOD_INSTAPAY');
      case TransactionType.Ewallet:
        return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.METHOD_EWALLET');
      case TransactionType.Credit:
        return this.translationService.getTranslation('WALLET.WITHDRAWAL_FORM.METHOD_CREDIT');
      default:
        return 'Unknown';
    }
  }

  /**
   * Get account info label based on transaction type
   */
  getAccountInfoLabel(type: TransactionType): string {
    switch (type) {
      case TransactionType.Instapay:
        return 'Account:';
      case TransactionType.Ewallet:
        return 'Number:';
      case TransactionType.Credit:
        return 'Card Info:';
      default:
        return 'Info:';
    }
  }

  /**
   * Check if transaction is a deposit (addition)
   * Based on the transactionmethod enum
   */
  isAddTransaction(transaction: WalletTransactionDto): boolean {
    // Check if transactionmethod is defined and equals Deposits (1)
    const isDeposit = transaction.transactionmethod !== undefined &&
      transaction.transactionmethod !== null &&
      transaction.transactionmethod === TransactionMethod.Deposits;

    console.log(`Transaction ${transaction.id}: method=${transaction.transactionmethod}, isDeposit=${isDeposit}, expected Deposits value=${TransactionMethod.Deposits}`);

    return isDeposit;
  }

  /**
   * Toggle payment status for withdrawal transactions (Admin only)
   */
  togglePaymentStatus(transaction: WalletTransactionDto): void {
    if (!this.isAdminView() || !transaction.id) {
      return;
    }

    const newStatus = !transaction.isPayed;
    const dto: UpdateWalletTransactionDto = {
      id: transaction.id,
      isPayed: newStatus
    };

    this.isUpdatingTransaction.set(transaction.id);

    this.walletService.updateWalletTransaction(dto).subscribe({
      next: () => {
        // Update the local transaction status
        const updatedTransactions = this.transactions().map(t =>
          t.id === transaction.id ? { ...t, isPayed: newStatus } : t
        );
        this.transactions.set(updatedTransactions);
        this.isUpdatingTransaction.set(null);
        console.log(`Transaction ${transaction.id} updated to ${newStatus ? 'Paid' : 'Pending'}`);
      },
      error: (error) => {
        console.error('Error updating transaction:', error);
        this.isUpdatingTransaction.set(null);
        Swal.fire({
          ...getSwalThemeConfig(this.themeService.isDark()),
          title: 'Error',
          text: 'Failed to update payment status. Please try again.',
          icon: 'error'
        });
      }
    });
  }
}
