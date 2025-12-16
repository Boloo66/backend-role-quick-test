# Wallet Service - NestJS Take-Home Test

A robust wallet service built with NestJS that provides APIs for creating wallets, funding them, transferring funds between wallets, and fetching wallet details with transaction history.

## Features

✅ Create wallets with USD currency
✅ Fund wallets with validation
✅ Transfer funds between wallets with balance checks
✅ Fetch wallet details with complete transaction history
✅ Idempotency support for fund and transfer operations
✅ Comprehensive error handling and validation
✅ Clean architecture with repository pattern
✅ Unit tests included
✅ In-memory storage implementation

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Validation**: class-validator, class-transformer
- **Testing**: Jest
- **Storage**: In-memory (Map-based repositories)

## Project Structure

```
wallet-service/
├── src/
│   ├── wallet/
│   │   ├── dto/                    # Data Transfer Objects
│   │   ├── entities/               # Domain entities
│   │   ├── interfaces/             # Repository interfaces
│   │   ├── repository/             # In-memory repositories
│   │   ├── wallet.service.ts       # Business logic
│   │   ├── wallet.controller.ts    # HTTP endpoints
│   │   └── wallet.module.ts        # Module definition
│   ├── common/
│   │   ├── exceptions/             # Custom exceptions
│   │   └── filters/                # Exception filters
│   ├── app.module.ts
│   └── main.ts
└── test/
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd wallet-service
```

2. Install dependencies:

```bash
npm install
```

3. Run the application:

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

### Running Tests

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## API Endpoints

### 1. Create Wallet

**POST** `/wallets`

Creates a new wallet with USD currency.

**Request Body:**

```json
{
  "currency": "USD",
  "initialBalance": 0
}
```

**Response:** (201 Created)

```json
{
  "id": "uuid",
  "currency": "USD",
  "balance": 0,
  "createdAt": "2025-12-15T10:00:00.000Z",
  "updatedAt": "2025-12-15T10:00:00.000Z"
}
```

### 2. Fund Wallet

**POST** `/wallets/:id/fund`

Adds funds to a wallet.

**Request Body:**

```json
{
  "amount": 1000,
  "reference": "optional-idempotency-key"
}
```

**Response:** (200 OK)

```json
{
  "id": "uuid",
  "currency": "USD",
  "balance": 1000,
  "createdAt": "2025-12-15T10:00:00.000Z",
  "updatedAt": "2025-12-15T10:05:00.000Z"
}
```

### 3. Transfer Between Wallets

**POST** `/wallets/transfer`

Transfers funds from one wallet to another.

**Request Body:**

```json
{
  "fromWalletId": "sender-uuid",
  "toWalletId": "receiver-uuid",
  "amount": 500,
  "reference": "optional-idempotency-key"
}
```

**Response:** (200 OK)

```json
{
  "senderWallet": {
    "id": "sender-uuid",
    "currency": "USD",
    "balance": 500,
    "createdAt": "2025-12-15T10:00:00.000Z",
    "updatedAt": "2025-12-15T10:10:00.000Z"
  },
  "receiverWallet": {
    "id": "receiver-uuid",
    "currency": "USD",
    "balance": 500,
    "createdAt": "2025-12-15T10:02:00.000Z",
    "updatedAt": "2025-12-15T10:10:00.000Z"
  }
}
```

### 4. Get Wallet Details

**GET** `/wallets/:id`

Fetches wallet details with transaction history.

**Response:** (200 OK)

```json
{
  "id": "uuid",
  "currency": "USD",
  "balance": 1500,
  "createdAt": "2025-12-15T10:00:00.000Z",
  "updatedAt": "2025-12-15T10:15:00.000Z",
  "transactions": [
    {
      "id": "tx-uuid",
      "walletId": "uuid",
      "type": "FUND",
      "amount": 1000,
      "balanceBefore": 0,
      "balanceAfter": 1000,
      "status": "SUCCESS",
      "reference": "ref-123",
      "createdAt": "2025-12-15T10:05:00.000Z"
    }
  ]
}
```

## Error Handling

The service implements comprehensive error handling:

### Error Response Format

```json
{
  "statusCode": 400,
  "timestamp": "2025-12-15T10:00:00.000Z",
  "path": "/wallets/transfer",
  "message": "Error message here",
  "error": "Error Type"
}
```

### Common Error Codes

- **404 Not Found**: Wallet doesn't exist
- **400 Bad Request**: Invalid input, insufficient balance, or currency mismatch
- **409 Conflict**: Duplicate transaction reference (idempotency)

## Design Decisions & Assumptions

### Architecture

- **Repository Pattern**: Separates data access logic from business logic
- **Interface-based Design**: Allows easy swapping of storage implementations
- **DTO Pattern**: Ensures type safety and validation at API boundaries
- **Custom Exceptions**: Provides meaningful error messages

### Assumptions

1. Only USD currency is supported
2. Negative balances are not allowed
3. Wallet IDs are UUIDs
4. Amounts are positive numbers
5. In-memory storage resets on application restart

### Idempotency

- Implemented using optional `reference` field
- Prevents duplicate transactions with the same reference
- Returns 409 Conflict if duplicate reference is detected

## Scaling Considerations

### Current Limitations (In-Memory)

- Data loss on restart
- Single instance only
- Limited by server memory
- No persistence

### Production Recommendations

1. **Database**
   - PostgreSQL with proper indexing
   - Use transactions for atomic operations
   - Add wallet_id + reference unique constraint for idempotency

2. **Caching**
   - Redis for frequently accessed wallet data
   - Cache invalidation on updates

3. **Distributed Systems**
   - Use distributed locks (Redis/DynamoDB) for concurrent transfers
   - Implement event sourcing for audit trail
   - Consider SAGA pattern for complex transactions

4. **Performance**
   - Database connection pooling
   - Horizontal scaling with load balancer
   - Read replicas for wallet queries
   - Background jobs for transaction processing

5. **Monitoring & Observability**
   - Centralized logging (ELK stack)
   - Metrics (Prometheus/Grafana)
   - Distributed tracing (Jaeger)
   - Alerting for failed transactions

6. **Security**
   - Authentication/Authorization (JWT)
   - Rate limiting
   - Encryption at rest and in transit
   - Audit logs

7. **High Availability**
   - Multi-region deployment
   - Database replication
   - Circuit breakers
   - Graceful degradation

## Testing

The service includes comprehensive unit tests covering:

- ✅ Wallet creation
- ✅ Funding operations
- ✅ Transfer operations
- ✅ Error scenarios (insufficient balance, invalid wallets)
- ✅ Transaction history retrieval

Run tests with:

```bash
npm run test
```

## License

MIT
