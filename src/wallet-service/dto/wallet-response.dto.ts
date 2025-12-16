import { Transaction } from '../entities/transaction.entity';

export class WalletResponseDto {
  id: string;
  currency: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Transaction[];
}
