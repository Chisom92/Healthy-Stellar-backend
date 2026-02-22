# Health Check Implementation

## Installation

Install required dependencies:

```bash
npm install @nestjs/terminus @nestjs/axios axios redis
```

## Environment Variables

Add to your `.env` file:

```env
REDIS_URL=redis://localhost:6379
IPFS_URL=http://localhost:5001
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Endpoints

- `GET /health` - Liveness probe (always returns ok)
- `GET /health/ready` - Readiness probe (checks all dependencies)

## Response Format

```json
{
  "status": "ok",
  "info": {
    "postgres": {
      "status": "up",
      "responseTime": "5ms"
    },
    "redis": {
      "status": "up",
      "responseTime": "3ms"
    },
    "ipfs": {
      "status": "up",
      "responseTime": "12ms"
    },
    "stellar": {
      "status": "up",
      "responseTime": "45ms"
    }
  },
  "error": {},
  "details": {
    "postgres": {
      "status": "up",
      "responseTime": "5ms"
    },
    "redis": {
      "status": "up",
      "responseTime": "3ms"
    },
    "ipfs": {
      "status": "up",
      "responseTime": "12ms"
    },
    "stellar": {
      "status": "up",
      "responseTime": "45ms"
    }
  }
}
```

Returns HTTP 503 if any dependency is down.
