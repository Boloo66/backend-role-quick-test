import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransferDto } from './dto/transfer.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWallet(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createWalletDto: CreateWalletDto,
  ) {
    return this.walletService.createWallet(createWalletDto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transfer(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    transferDto: TransferDto,
  ) {
    return this.walletService.transfer(transferDto);
  }

  @Post(':id/fund')
  @HttpCode(HttpStatus.OK)
  async fundWallet(
    @Param('id') id: string,
    @Body() fundWalletDto: FundWalletDto,
  ) {
    return this.walletService.fundWallet(id, fundWalletDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getWalletDetails(@Param('id') id: string) {
    return this.walletService.getWalletDetails(id);
  }
}
