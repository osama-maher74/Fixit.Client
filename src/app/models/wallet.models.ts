export interface WalletDto {
  id: number;
  craftsManId: number;
  balance: number;
  transactions?: WalletTransactionDto[];
}

export interface WalletTransactionDto {
  id: number;
  walletId: number;
  amount: number;
  transactionType: TransactionType;
  description?: string;
  createdAt: Date | string;
}

export enum TransactionType {
  Deposit = 0,
  Withdrawal = 1,
  Payment = 2,
  Refund = 3
}
