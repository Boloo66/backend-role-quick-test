import {
  IsString,
  IsNumber,
  IsPositive,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class TransferDto {
  @IsString()
  @IsUUID('4', { message: 'Invalid sender wallet ID' })
  fromWalletId: string;

  @IsString()
  @IsUUID('4', { message: 'Invalid receiver wallet ID' })
  toWalletId: string;

  @IsNumber()
  @IsPositive({ message: 'Amount must be positive' })
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
