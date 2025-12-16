import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { WalletRepository } from './repository/wallet.repository';
import { TransactionRepository } from './repository/transaction.repository';
import {
  WalletNotFoundException,
  InsufficientBalanceException,
  InvalidTransferException,
} from '../common/exceptions/wallet.exceptions';
import { Currency } from './dto/create-wallet.dto';

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [WalletService, WalletRepository, TransactionRepository],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWallet', () => {
    it('should create a wallet with initial balance', async () => {
      const createWalletDto = {
        currency: Currency.USD,
        initialBalance: 100,
      };

      const wallet = await service.createWallet(createWalletDto);

      expect(wallet).toBeDefined();
      expect(wallet.currency).toBe(Currency.USD);
      expect(wallet.balance).toBe(100);
      expect(wallet.id).toBeDefined();
    });

    it('should create a wallet with zero balance if not specified', async () => {
      const createWalletDto = {
        currency: Currency.USD,
      };

      const wallet = await service.createWallet(createWalletDto);

      expect(wallet.balance).toBe(0);
    });
  });

  describe('fundWallet', () => {
    it('should fund a wallet successfully', async () => {
      const createWalletDto = { currency: Currency.USD };
      const wallet = await service.createWallet(createWalletDto);

      const fundDto = { amount: 500 };
      const fundedWallet = await service.fundWallet(wallet.id, fundDto);

      expect(fundedWallet.balance).toBe(500);
    });

    it('should throw WalletNotFoundException for non-existent wallet', async () => {
      const fundDto = { amount: 500 };

      await expect(
        service.fundWallet('non-existent-id', fundDto),
      ).rejects.toThrow(WalletNotFoundException);
    });
  });

  describe('transfer', () => {
    it('should transfer funds between wallets successfully', async () => {
      const wallet1 = await service.createWallet({
        currency: Currency.USD,
        initialBalance: 1000,
      });
      const wallet2 = await service.createWallet({ currency: Currency.USD });

      const transferDto = {
        fromWalletId: wallet1.id,
        toWalletId: wallet2.id,
        amount: 300,
      };

      const result = await service.transfer(transferDto);

      expect(result.senderWallet.balance).toBe(700);
      expect(result.receiverWallet.balance).toBe(300);
    });

    it('should throw InsufficientBalanceException when balance is insufficient', async () => {
      const wallet1 = await service.createWallet({
        currency: Currency.USD,
        initialBalance: 100,
      });
      const wallet2 = await service.createWallet({ currency: Currency.USD });

      const transferDto = {
        fromWalletId: wallet1.id,
        toWalletId: wallet2.id,
        amount: 500,
      };

      await expect(service.transfer(transferDto)).rejects.toThrow(
        InsufficientBalanceException,
      );
    });

    it('should throw InvalidTransferException when transferring to same wallet', async () => {
      const wallet = await service.createWallet({
        currency: Currency.USD,
        initialBalance: 1000,
      });

      const transferDto = {
        fromWalletId: wallet.id,
        toWalletId: wallet.id,
        amount: 300,
      };

      await expect(service.transfer(transferDto)).rejects.toThrow(
        InvalidTransferException,
      );
    });
  });

  describe('getWalletDetails', () => {
    it('should return wallet with transaction history', async () => {
      const wallet = await service.createWallet({
        currency: Currency.USD,
        initialBalance: 1000,
      });

      await service.fundWallet(wallet.id, { amount: 500 });

      const details = await service.getWalletDetails(wallet.id);

      expect(details).toBeDefined();
      expect(details.balance).toBe(1500);
      expect(details.transactions).toBeDefined();
      expect(details.transactions?.length).toBeGreaterThan(0);
    });

    it('should throw WalletNotFoundException for non-existent wallet', async () => {
      await expect(service.getWalletDetails('non-existent-id')).rejects.toThrow(
        WalletNotFoundException,
      );
    });
  });
});
