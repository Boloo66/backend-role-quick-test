import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './repository/wallet.repository';
import { TransactionRepository } from './repository/transaction.repository';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletRepository, TransactionRepository],
})
export class WalletModule {}
