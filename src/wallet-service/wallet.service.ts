import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { WalletRepository } from './repository/wallet.repository';
import { TransactionRepository } from './repository/transaction.repository';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransferDto } from './dto/transfer.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { Wallet } from './entities/wallet.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './entities/transaction.entity';
import {
  WalletNotFoundException,
  InsufficientBalanceException,
  DuplicateTransactionException,
  InvalidTransferException,
} from '../common/exceptions/wallet.exceptions';
import { ConfigService } from '@nestjs/config';
import { FundWalletDto } from './dto/fund-wallet.dto';

@Injectable()
export class WalletService {
  private readonly maxTransferAmount: number;
  private readonly minTransferAmount: number;

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly configService: ConfigService,
  ) {
    this.maxTransferAmount = this.configService.get<number>(
      'wallet.maxTransferAmount',
      1000000,
    );
    this.minTransferAmount = this.configService.get<number>(
      'wallet.minTransferAmount',
      10,
    );
  }

  async createWallet(
    createWalletDto: CreateWalletDto,
  ): Promise<WalletResponseDto> {
    const wallet = new Wallet({
      id: uuidv4(),
      currency: createWalletDto.currency,
      balance: createWalletDto.initialBalance || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedWallet = await this.walletRepository.create(wallet);

    return this.mapToResponseDto(savedWallet);
  }

  async fundWallet(
    walletId: string,
    fundWalletDto: FundWalletDto,
  ): Promise<WalletResponseDto> {
    // Check for duplicate transaction (idempotency)
    if (fundWalletDto.reference) {
      const existingTransaction =
        await this.transactionRepository.findByReference(
          fundWalletDto.reference,
        );
      if (existingTransaction) {
        throw new DuplicateTransactionException(fundWalletDto.reference);
      }
    }

    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) {
      throw new WalletNotFoundException(walletId);
    }

    const balanceBefore = wallet.balance;
    wallet.balance += fundWalletDto.amount;
    wallet.updatedAt = new Date();

    // Create transaction record
    const transaction = new Transaction({
      id: uuidv4(),
      walletId: wallet.id,
      type: TransactionType.FUND,
      amount: fundWalletDto.amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      status: TransactionStatus.SUCCESS,
      reference: fundWalletDto.reference,
      createdAt: new Date(),
    });

    await this.transactionRepository.create(transaction);
    await this.walletRepository.update(wallet);

    return this.mapToResponseDto(wallet);
  }

  async transfer(transferDto: TransferDto): Promise<{
    senderWallet: WalletResponseDto;
    receiverWallet: WalletResponseDto;
  }> {
    if (transferDto.amount > this.maxTransferAmount) {
      throw new InvalidTransferException(
        `Transfer amount exceeds maximum limit of ${this.maxTransferAmount}`,
      );
    }

    if (transferDto.amount < this.minTransferAmount) {
      throw new InvalidTransferException(
        `Transfer amount is below minimum limit of ${this.minTransferAmount}`,
      );
    }

    // Validate sender and receiver are different
    if (transferDto.fromWalletId === transferDto.toWalletId) {
      throw new InvalidTransferException('Cannot transfer to the same wallet');
    }

    // Check for duplicate transaction (idempotency)
    if (transferDto.reference) {
      const existingTransaction =
        await this.transactionRepository.findByReference(transferDto.reference);
      if (existingTransaction) {
        throw new DuplicateTransactionException(transferDto.reference);
      }
    }

    // Fetch both wallets
    const senderWallet = await this.walletRepository.findById(
      transferDto.fromWalletId,
    );
    if (!senderWallet) {
      throw new WalletNotFoundException(transferDto.fromWalletId);
    }

    const receiverWallet = await this.walletRepository.findById(
      transferDto.toWalletId,
    );
    if (!receiverWallet) {
      throw new WalletNotFoundException(transferDto.toWalletId);
    }

    // Validate currency match
    if (senderWallet.currency !== receiverWallet.currency) {
      throw new InvalidTransferException('Currency mismatch between wallets');
    }

    // Check sufficient balance
    if (senderWallet.balance < transferDto.amount) {
      throw new InsufficientBalanceException(
        senderWallet.balance,
        transferDto.amount,
      );
    }

    // Perform transfer
    const senderBalanceBefore = senderWallet.balance;
    const receiverBalanceBefore = receiverWallet.balance;

    senderWallet.balance -= transferDto.amount;
    receiverWallet.balance += transferDto.amount;

    senderWallet.updatedAt = new Date();
    receiverWallet.updatedAt = new Date();

    // Create transaction records
    const senderTransaction = new Transaction({
      id: uuidv4(),
      walletId: senderWallet.id,
      type: TransactionType.TRANSFER_OUT,
      amount: transferDto.amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderWallet.balance,
      status: TransactionStatus.SUCCESS,
      reference: transferDto.reference,
      relatedWalletId: receiverWallet.id,
      metadata: { toWalletId: receiverWallet.id },
      createdAt: new Date(),
    });

    const receiverTransaction = new Transaction({
      id: uuidv4(),
      walletId: receiverWallet.id,
      type: TransactionType.TRANSFER_IN,
      amount: transferDto.amount,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverWallet.balance,
      status: TransactionStatus.SUCCESS,
      reference: transferDto.reference,
      relatedWalletId: senderWallet.id,
      metadata: { fromWalletId: senderWallet.id },
      createdAt: new Date(),
    });

    await this.transactionRepository.create(senderTransaction);
    await this.transactionRepository.create(receiverTransaction);
    await this.walletRepository.update(senderWallet);
    await this.walletRepository.update(receiverWallet);

    return {
      senderWallet: this.mapToResponseDto(senderWallet),
      receiverWallet: this.mapToResponseDto(receiverWallet),
    };
  }

  async getWalletDetails(walletId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) {
      throw new WalletNotFoundException(walletId);
    }

    const transactions =
      await this.transactionRepository.findByWalletId(walletId);

    return {
      ...this.mapToResponseDto(wallet),
      transactions,
    };
  }

  private mapToResponseDto(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      currency: wallet.currency,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
