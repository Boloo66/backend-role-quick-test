import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Server } from 'http';

interface WalletResponse {
  id: string;
  currency: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  transactions?: TransactionResponse[];
}

interface TransactionResponse {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  reference?: string;
  relatedWalletId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface TransferResponse {
  senderWallet: WalletResponse;
  receiverWallet: WalletResponse;
}

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error: string;
}

describe('Wallet E2E Tests', () => {
  let app: INestApplication;
  let httpServer: Server;
  let createdWalletId: string;
  /* eslint-disable-next-line */
  let secondWalletId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /wallets - Create Wallet', () => {
    it('should create a new wallet with initial balance', async () => {
      const createWalletDto = {
        currency: 'USD',
        initialBalance: 1000,
      };

      const response = await request(httpServer)
        .post('/wallets')
        .send(createWalletDto)
        .expect(201);

      const body = response.body as WalletResponse;

      expect(body).toHaveProperty('id');
      expect(body.currency).toBe('USD');
      expect(body.balance).toBe(1000);
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');

      createdWalletId = body.id;
      console.log('Created Wallet ID:', createdWalletId);
    });

    it('should create a new wallet with zero balance when initialBalance is not provided', async () => {
      const createWalletDto = {
        currency: 'USD',
      };

      const response = await request(httpServer)
        .post('/wallets')
        .send(createWalletDto)
        .expect(201);

      const body = response.body as WalletResponse;

      expect(body).toHaveProperty('id');
      expect(body.currency).toBe('USD');
      expect(body.balance).toBe(0);

      secondWalletId = body.id;
    });

    it('should fail when currency is missing', async () => {
      const response = await request(httpServer)
        .post('/wallets')
        .send({})
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(
        Array.isArray(body.message) ? body.message[0] : body.message,
      ).toContain('Currency must be USD');
    });

    it('should fail when currency is invalid', async () => {
      const response = await request(httpServer)
        .post('/wallets')
        .send({ currency: 'INVALID' })
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Currency must be USD');
    });

    it('should fail when initialBalance is negative', async () => {
      const response = await request(httpServer)
        .post('/wallets')
        .send({
          currency: 'USD',
          initialBalance: -100,
        })
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Initial balance must be non-negative');
    });

    it('should reject extra/unknown properties', async () => {
      const response = await request(httpServer)
        .post('/wallets')
        .send({
          currency: 'USD',
          initialBalance: 100,
          extraField: 'should not be allowed',
        })
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('property extraField should not exist');
    });
  });

  describe('POST /wallets/:id/fund - Fund Wallet', () => {
    it('should successfully fund a wallet', async () => {
      const fundDto = {
        amount: 500,
        reference: `fund-${Date.now()}`,
      };

      const response = await request(httpServer)
        .post(`/wallets/${createdWalletId}/fund`)
        .send(fundDto)
        .expect(200);

      const body = response.body as WalletResponse;

      expect(body.id).toBe(createdWalletId);
      expect(body.balance).toBe(1500); // 1000 initial + 500 funded
    });

    it('should fund wallet without reference', async () => {
      const fundDto = {
        amount: 250,
      };

      const response = await request(httpServer)
        .post(`/wallets/${createdWalletId}/fund`)
        .send(fundDto)
        .expect(200);

      const body = response.body as WalletResponse;

      expect(body.balance).toBe(1750); // 1500 + 250
    });

    it('should fail when amount is missing', async () => {
      const response = await request(httpServer)
        .post(`/wallets/${createdWalletId}/fund`)
        .send({})
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('amount')]),
      );
    });

    it('should fail when amount is negative', async () => {
      const response = await request(httpServer)
        .post(`/wallets/${createdWalletId}/fund`)
        .send({ amount: -100 })
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Amount must be positive');
    });

    it('should fail when amount is zero', async () => {
      const response = await request(httpServer)
        .post(`/wallets/${createdWalletId}/fund`)
        .send({ amount: 0 })
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Amount must be positive');
    });

    it('should fail when wallet does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(httpServer)
        .post(`/wallets/${nonExistentId}/fund`)
        .send({ amount: 100 })
        .expect(404);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Wallet with ID');
      expect(body.message).toContain('not found');
    });

    it('should prevent duplicate transaction with same reference', async () => {
      const reference = `unique-ref-${Date.now()}`;

      // First request should succeed
      await request(httpServer)
        .post(`/wallets/${createdWalletId}/fund`)
        .send({ amount: 100, reference })
        .expect(200);

      // Second request with same reference should fail
      const response = await request(httpServer)
        .post(`/wallets/${createdWalletId}/fund`)
        .send({ amount: 100, reference })
        .expect(409);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain(
        `Transaction with reference ${reference} already exists`,
      );
    });
  });

  describe('POST /wallets/transfer - Transfer Between Wallets', () => {
    let usdWallet1: string;
    let usdWallet2: string;

    beforeAll(async () => {
      // Create two USD wallets for transfer tests
      const wallet1Response = await request(httpServer)
        .post('/wallets')
        .send({ currency: 'USD', initialBalance: 5000 });
      usdWallet1 = (wallet1Response.body as WalletResponse).id;

      const wallet2Response = await request(httpServer)
        .post('/wallets')
        .send({ currency: 'USD', initialBalance: 1000 });
      usdWallet2 = (wallet2Response.body as WalletResponse).id;
    });

    it('should successfully transfer between wallets', async () => {
      const transferDto = {
        fromWalletId: usdWallet1,
        toWalletId: usdWallet2,
        amount: 500,
        reference: `transfer-${Date.now()}`,
      };

      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send(transferDto)
        .expect(200);

      const body = response.body as TransferResponse;

      expect(body.senderWallet.id).toBe(usdWallet1);
      expect(body.senderWallet.balance).toBe(4500); // 5000 - 500
      expect(body.receiverWallet.id).toBe(usdWallet2);
      expect(body.receiverWallet.balance).toBe(1500); // 1000 + 500
    });

    it('should transfer without reference', async () => {
      const transferDto = {
        fromWalletId: usdWallet1,
        toWalletId: usdWallet2,
        amount: 100,
      };

      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send(transferDto)
        .expect(200);

      const body = response.body as TransferResponse;

      expect(body.senderWallet.balance).toBe(4400); // 4500 - 100
      expect(body.receiverWallet.balance).toBe(1600); // 1500 + 100
    });

    it('should fail when amount exceeds sender balance', async () => {
      const transferDto = {
        fromWalletId: usdWallet1,
        toWalletId: usdWallet2,
        amount: 10000, // More than available balance
      };

      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send(transferDto)
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Insufficient balance');
    });

    it('should fail when transferring to the same wallet', async () => {
      const transferDto = {
        fromWalletId: usdWallet1,
        toWalletId: usdWallet1, // Same wallet
        amount: 100,
      };

      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send(transferDto)
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Cannot transfer to the same wallet');
    });

    it('should fail when amount is below minimum limit', async () => {
      const transferDto = {
        fromWalletId: usdWallet1,
        toWalletId: usdWallet2,
        amount: 5, // Below minimum of 10
      };

      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send(transferDto)
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('below minimum limit');
    });

    it('should fail when amount exceeds maximum limit', async () => {
      const transferDto = {
        fromWalletId: usdWallet1,
        toWalletId: usdWallet2,
        amount: 2000000, // Above maximum of 1000000
      };

      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send(transferDto)
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('exceeds maximum limit');
    });

    it('should fail when sender wallet does not exist', async () => {
      const nonExistentId = 'dec631da-aae5-4e59-b677-be2b11d83450';
      const transferDto = {
        fromWalletId: nonExistentId,
        toWalletId: usdWallet2,
        amount: 100,
      };

      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send(transferDto)
        .expect(404);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Wallet with ID');
      expect(body.message).toContain('not found');
    });

    it('should fail when receiver wallet does not exist', async () => {
      const nonExistentId = 'dec631da-aae5-4e59-b677-be2b11d83450';
      const transferDto = {
        fromWalletId: usdWallet1,
        toWalletId: nonExistentId,
        amount: 100,
      };

      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send(transferDto)
        .expect(404);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Wallet with ID');
      expect(body.message).toContain('not found');
    });

    it('should prevent duplicate transaction with same reference', async () => {
      const reference = `unique-transfer-${Date.now()}`;

      // First transfer should succeed
      await request(httpServer)
        .post('/wallets/transfer')
        .send({
          fromWalletId: usdWallet1,
          toWalletId: usdWallet2,
          amount: 50,
          reference,
        })
        .expect(200);

      // Second transfer with same reference should fail
      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send({
          fromWalletId: usdWallet1,
          toWalletId: usdWallet2,
          amount: 50,
          reference,
        })
        .expect(409);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain(
        `Transaction with reference ${reference} already exists`,
      );
    });

    it('should fail when required fields are missing', async () => {
      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send({ amount: 100 })
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('fromWalletId'),
          expect.stringContaining('toWalletId'),
        ]),
      );
    });

    it('should reject extra/unknown properties', async () => {
      const response = await request(httpServer)
        .post('/wallets/transfer')
        .send({
          fromWalletId: usdWallet1,
          toWalletId: usdWallet2,
          amount: 100,
          extraField: 'not allowed',
        })
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('property extraField should not exist');
    });
  });

  describe('GET /wallets/:id - Get Wallet Details', () => {
    it('should get wallet details with transactions', async () => {
      const response = await request(httpServer)
        .get(`/wallets/${createdWalletId}`)
        .expect(200);

      const body = response.body as WalletResponse;

      expect(body.id).toBe(createdWalletId);
      expect(body).toHaveProperty('currency');
      expect(body).toHaveProperty('balance');
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
      expect(body).toHaveProperty('transactions');
      expect(Array.isArray(body.transactions)).toBe(true);
      expect(body.transactions?.length).toBeGreaterThan(0);
    });

    it('should fail when wallet does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(httpServer)
        .get(`/wallets/${nonExistentId}`)
        .expect(404);

      const body = response.body as ErrorResponse;

      expect(body.message).toContain('Wallet with ID');
      expect(body.message).toContain('not found');
    });

    it('should return wallet with transactions showing correct transaction types', async () => {
      // Create a new wallet and perform various operations
      const newWallet = await request(httpServer)
        .post('/wallets')
        .send({ currency: 'USD', initialBalance: 1000 });

      const walletId = (newWallet.body as WalletResponse).id;

      // Fund the wallet
      await request(httpServer)
        .post(`/wallets/${walletId}/fund`)
        .send({ amount: 500 });

      // Get wallet details
      const response = await request(httpServer)
        .get(`/wallets/${walletId}`)
        .expect(200);

      const body = response.body as WalletResponse;

      expect(body.transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'FUND',
            amount: 500,
            status: 'SUCCESS',
          }),
        ]),
      );
    });
  });

  describe('Integration: Complete Wallet Lifecycle', () => {
    it('should handle a complete wallet lifecycle', async () => {
      // 1. Create two wallets
      const wallet1 = await request(httpServer)
        .post('/wallets')
        .send({ currency: 'USD', initialBalance: 2000 });

      const wallet2 = await request(httpServer)
        .post('/wallets')
        .send({ currency: 'USD', initialBalance: 500 });

      const wallet1Id = (wallet1.body as WalletResponse).id;
      const wallet2Id = (wallet2.body as WalletResponse).id;

      // 2. Fund first wallet
      await request(httpServer)
        .post(`/wallets/${wallet1Id}/fund`)
        .send({ amount: 1000 });

      // 3. Transfer from wallet1 to wallet2
      const transfer = await request(httpServer)
        .post('/wallets/transfer')
        .send({
          fromWalletId: wallet1Id,
          toWalletId: wallet2Id,
          amount: 800,
        });

      const transferBody = transfer.body as TransferResponse;

      expect(transferBody.senderWallet.balance).toBe(2200); // 2000 + 1000 - 800
      expect(transferBody.receiverWallet.balance).toBe(1300); // 500 + 800

      // 4. Get wallet details and verify transactions
      const wallet1Details = await request(httpServer).get(
        `/wallets/${wallet1Id}`,
      );

      const wallet1Body = wallet1Details.body as WalletResponse;

      expect(wallet1Body.balance).toBe(2200);
      expect(wallet1Body.transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'FUND' }),
          expect.objectContaining({ type: 'TRANSFER_OUT' }),
        ]),
      );

      const wallet2Details = await request(httpServer).get(
        `/wallets/${wallet2Id}`,
      );

      const wallet2Body = wallet2Details.body as WalletResponse;

      expect(wallet2Body.balance).toBe(1300);
      expect(wallet2Body.transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'TRANSFER_IN' }),
        ]),
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large valid amounts', async () => {
      const wallet = await request(httpServer)
        .post('/wallets')
        .send({ currency: 'USD', initialBalance: 999999 });

      const response = await request(httpServer)
        .post(`/wallets/${(wallet.body as WalletResponse).id}/fund`)
        .send({ amount: 999999 })
        .expect(200);

      const body = response.body as WalletResponse;

      expect(body.balance).toBe(1999998);
    });

    it('should handle decimal amounts', async () => {
      const wallet = await request(httpServer)
        .post('/wallets')
        .send({ currency: 'USD', initialBalance: 100 });

      const response = await request(httpServer)
        .post(`/wallets/${(wallet.body as WalletResponse).id}/fund`)
        .send({ amount: 99.99 })
        .expect(200);

      const body = response.body as WalletResponse;

      expect(body.balance).toBeCloseTo(199.99, 2);
    });

    it('should reject non-numeric amount values', async () => {
      const response = await request(httpServer)
        .post(`/wallets/${createdWalletId}/fund`)
        .send({ amount: 'not-a-number' })
        .expect(400);

      const body = response.body as ErrorResponse;

      expect(body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('amount')]),
      );
    });

    it('should reject invalid UUID format for wallet ID', async () => {
      const response = await request(httpServer)
        .get('/wallets/invalid-uuid')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode');
    });
  });
});
