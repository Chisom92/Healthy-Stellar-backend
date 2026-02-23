import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StellarService } from './stellar.service';

describe('StellarService', () => {
  let service: StellarService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StellarService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'SOROBAN_RPC_URL') return 'https://soroban-testnet.stellar.org';
              if (key === 'SOROBAN_CONTRACT_ID') return 'test-contract-id';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StellarService>(StellarService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyAccessOnChain', () => {
    it('should verify access on Soroban contract', async () => {
      const requesterId = 'requester-123';
      const recordId = 'record-456';

      const result = await service.verifyAccessOnChain(requesterId, recordId);

      expect(result).toEqual({
        hasAccess: expect.any(Boolean),
        txHash: expect.any(String),
        grantId: expect.any(String),
      });
    });

    it('should return access verification result', async () => {
      const result = await service.verifyAccessOnChain('user-1', 'record-1');

      expect(result).toHaveProperty('hasAccess');
      expect(typeof result.hasAccess).toBe('boolean');
    });
  });
});
