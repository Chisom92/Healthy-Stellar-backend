# Decentralized Healthcare System – NestJS Backend

Comprehensive NestJS backend for a decentralized healthcare management system.
This service acts as the application layer between client applications and
Stellar Soroban smart contracts, handling secure healthcare workflows, user
authentication, and blockchain synchronization.

---

## Table of Contents

- Architecture Overview
- Project Structure
- Installation & Setup
- Configuration
- Core Modules
- API Endpoints
- Database Schema
- Authentication & Authorization
- Stellar Integration
- Error Handling
- Testing
- Deployment

---

## Architecture Overview

The NestJS backend serves as the **middleware layer** between frontend clients
and the Stellar blockchain. It is responsible for orchestrating business logic,
securely handling sensitive medical data, and synchronizing off-chain and
on-chain state.

### Key Responsibilities

- RESTful API endpoints for client applications
- Off-chain data caching and indexing
- User authentication and session management
- Encryption and decryption of sensitive healthcare data
- Event listening and blockchain state synchronization
- Business logic orchestration
- File upload and secure storage management

This architecture ensures:

- Data integrity
- Security of protected health information (PHI)
- Scalability and modularity
- Clear separation of concerns between blockchain and application logic

---

## Project Structure

```txt
src/
├── auth/                # Authentication and authorization
├── users/               # User management
├── healthcare/          # Healthcare domain logic
├── stellar/             # Stellar Soroban integration
├── database/            # Database configuration and entities
├── common/              # Shared utilities, guards, interceptors
├── config/              # Environment and application configuration
├── app.module.ts        # Root application module
└── main.ts              # Application entry point
```
