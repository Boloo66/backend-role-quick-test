import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  validateSync,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum DatabaseType {
  InMemory = 'in-memory',
  PostgreSQL = 'postgresql',
  MySQL = 'mysql',
}

class EnvironmentVariables {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT?: number = 3000;

  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment = Environment.Development;

  @IsOptional()
  @IsString()
  APP_NAME?: string = 'Wallet Service';

  @IsOptional()
  @IsString()
  APP_VERSION?: string = '1.0.0';

  @IsOptional()
  @IsEnum(DatabaseType)
  DB_TYPE?: DatabaseType = DatabaseType.InMemory;

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @IsNumber()
  DB_PORT?: number;

  @IsOptional()
  @IsString()
  DB_USERNAME?: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DB_NAME?: string;

  @IsOptional()
  @IsString()
  DEFAULT_CURRENCY?: string = 'USD';

  @IsOptional()
  @IsNumber()
  @Min(0)
  MAX_TRANSFER_AMOUNT?: number = 1000000;

  @IsOptional()
  @IsNumber()
  @Min(0)
  MIN_TRANSFER_AMOUNT?: number = 0.01;

  @IsOptional()
  @IsBoolean()
  ENABLE_IDEMPOTENCY?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  RATE_LIMIT_TTL?: number = 60;

  @IsOptional()
  @IsNumber()
  @Min(1)
  RATE_LIMIT_MAX?: number = 100;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string = 'info';

  @IsOptional()
  @IsBoolean()
  ENABLE_CONSOLE_LOGS?: boolean = true;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation error:\n${errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('\n')}`,
    );
  }

  return validatedConfig;
}
