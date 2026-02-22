# Records Upload Flow - Architecture Diagram

## High-Level Flow

```
┌─────────────────┐
│   Client App    │
│  (Frontend)     │
└────────┬────────┘
         │
         │ 1. Encrypt medical record client-side
         │    (AES-256 encryption)
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                    POST /records                        │
│              (multipart/form-data)                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - patientId: "patient-123"                        │ │
│  │ - recordType: "MEDICAL_REPORT"                    │ │
│  │ - description: "Annual checkup"                   │ │
│  │ - file: <encrypted-binary-blob>                   │ │
│  └───────────────────────────────────────────────────┘ │
└────────┬────────────────────────────────────────────────┘
         │
         │ 2. Validate file size (max 10MB)
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│           RecordsController                             │
│  - Receives multipart request                           │
│  - Validates DTO                                        │
│  - Extracts file buffer                                 │
└────────┬────────────────────────────────────────────────┘
         │
         │ 3. Pass to service layer
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│           RecordsService                                │
│  - Orchestrates the upload flow                         │
└────────┬────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────────────┐
         │                                                 │
         │ 4. Upload to IPFS                               │ 5. Anchor on Stellar
         ▼                                                 ▼
┌──────────────────────┐                    ┌──────────────────────┐
│   IpfsService        │                    │   StellarService     │
│                      │                    │                      │
│ - Connect to IPFS    │                    │ - Load account       │
│ - Upload buffer      │                    │ - Build transaction  │
│ - Return CID         │                    │ - Call contract      │
└──────┬───────────────┘                    │ - Sign & submit      │
       │                                    │ - Return tx hash     │
       │ CID: QmXxx...                      └──────┬───────────────┘
       │                                           │
       │                                           │ TxHash: abc123...
       │                                           │
       └───────────────┬───────────────────────────┘
                       │
                       │ 6. Save metadata
                       ▼
         ┌──────────────────────────────┐
         │      PostgreSQL              │
         │  ┌────────────────────────┐  │
         │  │ records table          │  │
         │  ├────────────────────────┤  │
         │  │ id: uuid               │  │
         │  │ patientId: string      │  │
         │  │ cid: string            │  │
         │  │ stellarTxHash: string  │  │
         │  │ recordType: enum       │  │
         │  │ description: string    │  │
         │  │ createdAt: timestamp   │  │
         │  └────────────────────────┘  │
         └──────────────┬───────────────┘
                        │
                        │ 7. Return response
                        ▼
         ┌──────────────────────────────┐
         │   Response JSON              │
         │  {                           │
         │    "recordId": "uuid",       │
         │    "cid": "QmXxx...",        │
         │    "stellarTxHash": "abc..." │
         │  }                           │
         └──────────────────────────────┘
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         NestJS Backend                           │
│                                                                  │
│  ┌────────────────┐                                             │
│  │   Controller   │                                             │
│  │   Layer        │                                             │
│  └───────┬────────┘                                             │
│          │                                                       │
│          ▼                                                       │
│  ┌────────────────┐                                             │
│  │   Service      │                                             │
│  │   Layer        │                                             │
│  └───┬────────┬───┘                                             │
│      │        │                                                 │
│      │        └──────────────┐                                  │
│      │                       │                                  │
│      ▼                       ▼                                  │
│  ┌─────────┐          ┌──────────┐                             │
│  │  IPFS   │          │ Stellar  │                             │
│  │ Service │          │ Service  │                             │
│  └────┬────┘          └────┬─────┘                             │
│       │                    │                                    │
└───────┼────────────────────┼────────────────────────────────────┘
        │                    │
        │                    │
        ▼                    ▼
┌──────────────┐    ┌─────────────────┐
│  IPFS Node   │    │ Stellar Network │
│              │    │   (Testnet)     │
│ - Stores     │    │                 │
│   encrypted  │    │ - Soroban       │
│   records    │    │   Contract      │
│              │    │ - Immutable     │
│ - Returns    │    │   ledger        │
│   CID        │    │                 │
└──────────────┘    └─────────────────┘
```

## Data Flow Sequence

```
Client          Controller       Service         IPFS         Stellar      Database
  │                 │               │              │             │            │
  │─────────────────>               │              │             │            │
  │  POST /records  │               │              │             │            │
  │                 │               │              │             │            │
  │                 │───────────────>              │             │            │
  │                 │  uploadRecord │              │             │            │
  │                 │               │              │             │            │
  │                 │               │──────────────>             │            │
  │                 │               │  upload()    │             │            │
  │                 │               │              │             │            │
  │                 │               │<─────────────│             │            │
  │                 │               │  CID         │             │            │
  │                 │               │              │             │            │
  │                 │               │──────────────────────────> │            │
  │                 │               │  anchorCid() │             │            │
  │                 │               │              │             │            │
  │                 │               │<───────────────────────────│            │
  │                 │               │  TxHash      │             │            │
  │                 │               │              │             │            │
  │                 │               │────────────────────────────────────────>
  │                 │               │  save()      │             │            │
  │                 │               │              │             │            │
  │                 │               │<───────────────────────────────────────│
  │                 │               │  Record      │             │            │
  │                 │               │              │             │            │
  │                 │<──────────────│              │             │            │
  │                 │  Response     │              │             │            │
  │                 │               │              │             │            │
  │<────────────────│               │              │             │            │
  │  JSON Response  │               │             │             │            │
  │                 │               │              │             │            │
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  - React/Vue/Angular                                    │
│  - Client-side encryption (AES-256)                     │
│  - File upload handling                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend Layer (NestJS)                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Controllers: RecordsController                    │ │
│  │ Services: RecordsService, IpfsService,            │ │
│  │           StellarService                          │ │
│  │ DTOs: CreateRecordDto                             │ │
│  │ Entities: Record                                  │ │
│  │ Validation: class-validator                       │ │
│  │ File Handling: Multer                             │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ IPFS Network │  │   Stellar    │
│              │  │              │  │   Blockchain │
│ - TypeORM    │  │ - HTTP API   │  │              │
│ - Metadata   │  │ - Content    │  │ - Soroban    │
│   storage    │  │   addressing │  │   Contracts  │
│              │  │              │  │ - Immutable  │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Security Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Security Layers                        │
│                                                         │
│  1. Client-Side Encryption                              │
│     └─> AES-256 encryption before upload                │
│                                                         │
│  2. Transport Security                                  │
│     └─> HTTPS/TLS for API communication                 │
│                                                         │
│  3. Authentication & Authorization                      │
│     └─> JWT tokens, role-based access                   │
│                                                         │
│  4. File Validation                                     │
│     └─> Size limits, type checking                      │
│                                                         │
│  5. Blockchain Immutability                             │
│     └─> Stellar ledger provides tamper-proof audit      │
│                                                         │
│  6. Distributed Storage                                 │
│     └─> IPFS ensures data availability                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Error Scenarios                       │
│                                                         │
│  File Too Large (>10MB)                                 │
│  └─> 413 Payload Too Large                              │
│                                                         │
│  Missing File                                           │
│  └─> 400 Bad Request                                    │
│                                                         │
│  Invalid DTO                                            │
│  └─> 400 Bad Request (validation errors)                │
│                                                         │
│  IPFS Upload Failure                                    │
│  └─> 500 Internal Server Error                          │
│      └─> Rollback: No database entry                    │
│                                                         │
│  Stellar Transaction Failure                            │
│  └─> 500 Internal Server Error                          │
│      └─> Rollback: No database entry                    │
│                                                         │
│  Database Save Failure                                  │
│  └─> 500 Internal Server Error                          │
│      └─> Note: CID already on IPFS/Stellar              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Production Setup                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Load Balancer (NGINX)                   │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                   │
│         ┌───────────┼───────────┐                       │
│         │           │           │                       │
│         ▼           ▼           ▼                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ NestJS   │ │ NestJS   │ │ NestJS   │               │
│  │ Instance │ │ Instance │ │ Instance │               │
│  │    1     │ │    2     │ │    3     │               │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘               │
│       │            │            │                       │
│       └────────────┼────────────┘                       │
│                    │                                    │
│         ┌──────────┼──────────┐                         │
│         │          │          │                         │
│         ▼          ▼          ▼                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │PostgreSQL│ │   IPFS   │ │ Stellar  │               │
│  │ Primary  │ │  Cluster │ │  Network │               │
│  │          │ │          │ │          │               │
│  │ Replica  │ │  Pinning │ │ Horizon  │               │
│  │          │ │  Service │ │  API     │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

This architecture ensures:
- ✅ High availability
- ✅ Scalability
- ✅ Data redundancy
- ✅ Blockchain immutability
- ✅ Distributed storage
- ✅ HIPAA compliance
