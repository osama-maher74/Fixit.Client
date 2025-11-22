import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WalletDto } from '../models/wallet.models';

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
}
