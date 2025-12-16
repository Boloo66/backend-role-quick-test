import { HttpException, HttpStatus } from '@nestjs/common';

export class WalletNotFoundException extends HttpException {
  constructor(walletId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Wallet with ID ${walletId} not found`,
        error: 'Wallet Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InsufficientBalanceException extends HttpException {
  constructor(currentBalance: number, requiredAmount: number) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Insufficient balance. Current: ${currentBalance}, Required: ${requiredAmount}`,
        error: 'Insufficient Balance',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class DuplicateTransactionException extends HttpException {
  constructor(reference: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Transaction with reference ${reference} already exists`,
        error: 'Duplicate Transaction',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidTransferException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Invalid Transfer',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
