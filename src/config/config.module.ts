import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import envConfiguration from './env.configuration';
import { validate } from './env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [envConfiguration],
      validate,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
