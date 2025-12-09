import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { WalletDto, CreateWalletTransactionDto, WithdrawalResponse, WalletTransactionDto, UpdateWalletTransactionDto, AddFundsResponse } from '../models/wallet.models';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private readonly WALLET_API = `${environment.apiUrl}/Wallet`;

  /**
   * Get wallet by craftsman ID
   * @param craftsManId - Craftsman ID
   * @returns Observable of WalletDto
   */
  getWalletByCraftsmanId(craftsManId: number): Observable<WalletDto> {
    const url = `${this.WALLET_API}/craftsman/${craftsManId}`;
    console.log('WalletService - Fetching wallet for craftsman ID:', craftsManId);
    console.log('WalletService - URL:', url);
    return this.http.get<WalletDto>(url);
  }

  /**
   * Withdraw funds from wallet
   * @param dto - CreateWalletTransactionDto
   * @returns Observable of WithdrawalResponse
   */
  withdrawFunds(dto: CreateWalletTransactionDto): Observable<WithdrawalResponse> {
    const url = `${this.WALLET_API}/withdraw`;
    console.log('WalletService - Withdrawing funds:', dto);
    return this.http.post<WithdrawalResponse>(url, dto);
  }

  /**
   * Get wallet transactions by craftsman ID
   * @param craftsManId - Craftsman ID
   * @returns Observable of WalletTransactionDto array
   */
  getWalletTransactions(craftsManId: number): Observable<WalletTransactionDto[]> {
    const url = `${this.WALLET_API}/craftsman/${craftsManId}/transactions`;
    console.log('WalletService - Fetching transactions for craftsman ID:', craftsManId);
    return this.http.get<any[]>(url).pipe(
      map(transactions => transactions.map(tx => ({
        ...tx,
        isPayed: tx.isPayed !== undefined ? tx.isPayed : tx.ispayed // Handle backend casing
      })))
    );
  }

  /**
   * Update wallet transaction (admin only - update isPayed status)
   * @param dto - UpdateWalletTransactionDto
   * @returns Observable of any
   */
  updateWalletTransaction(dto: UpdateWalletTransactionDto): Observable<any> {
    const url = `${this.WALLET_API}/transaction`;
    console.log('WalletService - Updating transaction:', dto);
    return this.http.put<any>(url, dto);
  }

  /**
   * Add funds to craftsman wallet (admin only)
   * @param dto - CreateWalletTransactionDto
   * @returns Observable of AddFundsResponse
   */
  addFunds(dto: CreateWalletTransactionDto): Observable<AddFundsResponse> {
    const url = `${this.WALLET_API}/add`;
    console.log('WalletService - Adding funds:', dto);
    return this.http.post<AddFundsResponse>(url, dto);
  }
}
