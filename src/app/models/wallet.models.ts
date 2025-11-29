export interface WalletDto {
  id: number;
  craftsManId: number;
  balance: number;
  transactions?: WalletTransactionDto[];
}

export interface WalletTransactionDto {
  id: number;
  amount: number;
  transactionmethod?: TransactionMethod;
  transactiontype?: TransactionType;
  transationInfo?: string;
  createdAt: Date | string;
  isPayed?: boolean;
}

export enum TransactionMethod {
  Withdraw = 0,
  Deposits = 1
}

export enum TransactionType {
  Instapay = 0,
  Ewallet = 1,
  Credit = 2
}

export interface CreateWalletTransactionDto {
  craftsManId: number;
  walletId: number;
  amount?: number;
  transactionmethod?: TransactionMethod;
  transactiontype?: TransactionType;
  transationInfo?: string;
  createdAt: Date;
  serviceRequestId?: number;
}

export interface WithdrawalResponse {
  message: string;
  craftsManId: number;
  amountWithdrawn: number;
  date: Date;
  withdrawmethod: TransactionType;
  withdrawmethodinfo: string;
}

export interface UpdateWalletTransactionDto {
  id: number;
  isPayed?: boolean;
}
