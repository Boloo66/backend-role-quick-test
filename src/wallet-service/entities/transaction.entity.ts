export enum TransactionType {
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  FUND = 'FUND',
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  reference?: string;
  relatedWalletId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;

  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }
}
