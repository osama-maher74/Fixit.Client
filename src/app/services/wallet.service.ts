import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WalletDto, CreateWalletTransactionDto, WithdrawalResponse, WalletTransactionDto } from '../models/wallet.models';

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
    const url = `${this.WALLET_API}/${craftsManId}`;
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
    const url = `${this.WALLET_API}/${craftsManId}/transactions`;
    console.log('WalletService - Fetching transactions for craftsman ID:', craftsManId);
    return this.http.get<WalletTransactionDto[]>(url);
  }
}
