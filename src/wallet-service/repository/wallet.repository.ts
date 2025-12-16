import { Injectable } from '@nestjs/common';
import { Wallet } from '../entities/wallet.entity';
import { IWalletRepository } from '../interfaces/wallet-repository.interface';

@Injectable()
export class WalletRepository implements IWalletRepository {
  private wallets: Map<string, Wallet> = new Map();

  async create(wallet: Wallet): Promise<Wallet> {
    this.wallets.set(wallet.id, wallet);
    return Promise.resolve(wallet);
  }

  async findById(id: string): Promise<Wallet | null> {
    const wallet = this.wallets.get(id);
    return Promise.resolve(wallet || null);
  }

  async update(wallet: Wallet): Promise<Wallet> {
    this.wallets.set(wallet.id, wallet);
    return Promise.resolve(wallet);
  }

  async findAll(): Promise<Wallet[]> {
    return Promise.resolve(Array.from(this.wallets.values()));
  }
}
