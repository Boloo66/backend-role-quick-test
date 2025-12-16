import { Injectable } from '@nestjs/common';
import { Transaction } from '../entities/transaction.entity';
import { ITransactionRepository } from '../interfaces/transaction.repository.interface';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  private transactions: Map<string, Transaction> = new Map();
  private referenceIndex: Map<string, string> = new Map();

  async create(transaction: Transaction): Promise<Transaction> {
    this.transactions.set(transaction.id, transaction);

    if (transaction.reference) {
      this.referenceIndex.set(transaction.reference, transaction.id);
    }

    return Promise.resolve(transaction);
  }

  async findByWalletId(walletId: string): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .filter((tx) => tx.walletId === walletId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve(transactions);
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const transactionId = this.referenceIndex.get(reference);
    if (!transactionId) {
      return Promise.resolve(null);
    }
    const transaction = this.transactions.get(transactionId);
    return Promise.resolve(transaction || null);
  }
}
