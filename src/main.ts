import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const SIGTERMS = ['SIGINT', 'SIGTERM'] as const;

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  SIGTERMS.forEach((signal) => {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      void app.close().then(() => {
        console.log('Application closed');
        process.exit(0);
      });
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = configService.get<number>('port', 3000);
  const appName = configService.get<string>('app.name', 'Wallet Service');

  await app.listen(port);
  console.log(`${appName} is running on http://localhost:${port}`);
  console.log(`Environment: ${configService.get<string>('nodeEnv')}`);
}

bootstrap().catch((err: Error) => {
  console.error('Error starting the application', err.message);
  process.exit(1);
});
