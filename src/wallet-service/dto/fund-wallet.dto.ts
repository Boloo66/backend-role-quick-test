import { IsPositive, IsString, IsOptional, IsNumber } from 'class-validator';
import { Type, Expose } from 'class-transformer';

export class FundWalletDto {
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive({ message: 'Amount must be positive' })
  amount: number;

  @Expose()
  @IsOptional()
  @IsString()
  reference?: string;
}
