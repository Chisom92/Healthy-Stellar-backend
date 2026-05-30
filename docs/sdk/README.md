# SDK & GraphQL Documentation

## REST SDK

Auto-generated TypeScript REST client: [`packages/sdk`](../../packages/sdk).

Install from npm:
```bash
npm install @medchain/sdk
```

## GraphQL API

### Schema

The canonical GraphQL schema is exported to [`docs/schema.graphql`](../schema.graphql) every time the
NestJS application starts (via `autoSchemaFile` in `GraphQLModule`). Commit this file to keep it in sync.

### Explorer

In non-production environments the GraphQL Playground is available at `/graphql`.

### TypeScript Types

Types are auto-generated from the schema using `graphql-codegen`:

```bash
# 1. Start the server once to regenerate docs/schema.graphql
npm run start:dev

# 2. Generate TypeScript types into packages/sdk/src/graphql/types.ts
npm run generate:graphql-types
```

Import generated types:

```typescript
import type { Patient, Record, Query, Mutation } from '@medchain/sdk/graphql';
```

### Configuration

`codegen.yml` at the repo root controls which plugins run and where output lands.
