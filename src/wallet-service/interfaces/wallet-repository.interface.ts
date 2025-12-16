import { Wallet } from '../entities/wallet.entity';

export interface IWalletRepository {
  create(wallet: Wallet): Promise<Wallet>;
  findById(id: string): Promise<Wallet | null>;
  update(wallet: Wallet): Promise<Wallet>;
  findAll(): Promise<Wallet[]>;
}
