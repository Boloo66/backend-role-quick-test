import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

export enum Currency {
  USD = 'USD',
}

export class CreateWalletDto {
  @IsEnum(Currency, { message: 'Currency must be USD' })
  currency: Currency;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Initial balance must be non-negative' })
  initialBalance?: number;
}
