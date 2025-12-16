export default () => ({
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    name: process.env.APP_NAME || 'Wallet Service',
    version: process.env.APP_VERSION || '1.0.0',
  },
  database: {
    type: process.env.DB_TYPE || 'in-memory',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wallet_db',
  },
  wallet: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    maxTransferAmount:
      parseFloat(process.env.MAX_TRANSFER_AMOUNT || '1000000') || 1000000,
    minTransferAmount:
      parseFloat(process.env.MIN_TRANSFER_AMOUNT || '0.01') || 0.01,
  },
  security: {
    enableIdempotency: process.env.ENABLE_IDEMPOTENCY !== 'false',
    rateLimitTTL: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) || 60,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGS !== 'false',
  },
});
