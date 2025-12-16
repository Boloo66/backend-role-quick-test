import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { WalletModule } from './wallet-service/wallet.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, WalletModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
