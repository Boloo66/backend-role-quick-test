import { Transaction } from '../entities/transaction.entity';

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<Transaction>;
  findByWalletId(walletId: string): Promise<Transaction[]>;
  findByReference(reference: string): Promise<Transaction | null>;
}
