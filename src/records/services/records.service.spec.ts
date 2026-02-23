import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecordsService } from './records.service';
import { Record } from '../entities/record.entity';
import { AccessControlService } from '../../access-control/services/access-control.service';
import { StellarService } from '../../stellar/services/stellar.service';
import { IpfsService } from '../../stellar/services/ipfs.service';
import { MedicalCacheService } from '../../performance/medical-cache/medical-cache.service';
import { AuditLogService } from '../../common/audit/audit-log.service';

describe('RecordsService', () => {
  let service: RecordsService;
  let recordRepository: any;
  let accessControlService: any;
  let stellarService: any;
  let ipfsService: any;
  let cacheService: any;
  let auditLogService: any;

  const mockRecord = {
    id: 'record-123',
    patientId: 'patient-456',
    cid: 'QmTest123',
    stellarTxHash: 'stellar-tx-hash-123',
    metadata: { recordType: 'consultation' },
  };

  const mockIpfsBlob = {
    cid: 'QmTest123',
    encryptedPayload: 'encrypted-data-here',
    metadata: { fetchedAt: '2024-01-01T00:00:00Z', size: 1024 },
  };

  beforeEach(async () => {
    recordRepository = {
      findOne: jest.fn(),
    };

    accessControlService = {
      verifyAccess: jest.fn(),
    };

    stellarService = {
      verifyAccessOnChain: jest.fn(),
    };

    ipfsService = {
      fetch: jest.fn(),
    };

    cacheService = {
      getOrSet: jest.fn(),
    };

    auditLogService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        { provide: getRepositoryToken(Record), useValue: recordRepository },
        { provide: AccessControlService, useValue: accessControlService },
        { provide: StellarService, useValue: stellarService },
        { provide: IpfsService, useValue: ipfsService },
        { provide: MedicalCacheService, useValue: cacheService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecord', () => {
    it('should return record when access is granted', async () => {
      recordRepository.findOne.mockResolvedValue(mockRecord);
      cacheService.getOrSet.mockImplementation(async (key, getter) => {
        return await getter();
      });
      accessControlService.verifyAccess.mockResolvedValue(true);
      stellarService.verifyAccessOnChain.mockResolvedValue({ hasAccess: true });
      ipfsService.fetch.mockResolvedValue(mockIpfsBlob);

      const result = await service.getRecord('record-123', 'requester-789');

      expect(result).toEqual({
        cid: 'QmTest123',
        encryptedPayload: 'encrypted-data-here',
        metadata: {
          recordType: 'consultation',
          fetchedAt: '2024-01-01T00:00:00Z',
          size: 1024,
        },
        stellarTxHash: 'stellar-tx-hash-123',
      });

      expect(recordRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'record-123' },
      });
      expect(accessControlService.verifyAccess).toHaveBeenCalledWith('requester-789', 'record-123');
      expect(stellarService.verifyAccessOnChain).toHaveBeenCalledWith('requester-789', 'record-123');
      expect(ipfsService.fetch).toHaveBeenCalledWith('QmTest123');
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RECORD_ACCESSED',
          entity: 'Record',
          entityId: 'record-123',
        }),
      );
    });

    it('should throw NotFoundException when record does not exist', async () => {
      recordRepository.findOne.mockResolvedValue(null);

      await expect(service.getRecord('non-existent', 'requester-789')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException and emit audit event when access is denied', async () => {
      recordRepository.findOne.mockResolvedValue(mockRecord);
      cacheService.getOrSet.mockImplementation(async (key, getter) => {
        return await getter();
      });
      accessControlService.verifyAccess.mockResolvedValue(false);

      await expect(service.getRecord('record-123', 'unauthorized-user')).rejects.toThrow(
        ForbiddenException,
      );

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          entity: 'Record',
          entityId: 'record-123',
          severity: 'HIGH',
        }),
      );
    });

    it('should use cached access check result', async () => {
      recordRepository.findOne.mockResolvedValue(mockRecord);
      cacheService.getOrSet.mockResolvedValue(true);
      ipfsService.fetch.mockResolvedValue(mockIpfsBlob);

      await service.getRecord('record-123', 'requester-789');

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        'access:requester-789:record-123',
        expect.any(Function),
        expect.objectContaining({
          ttlMs: 60000,
          category: 'access-control',
          priority: 'high',
        }),
      );
    });

    it('should verify on-chain access when database access is granted', async () => {
      recordRepository.findOne.mockResolvedValue(mockRecord);
      cacheService.getOrSet.mockImplementation(async (key, getter) => {
        return await getter();
      });
      accessControlService.verifyAccess.mockResolvedValue(true);
      stellarService.verifyAccessOnChain.mockResolvedValue({ hasAccess: true });
      ipfsService.fetch.mockResolvedValue(mockIpfsBlob);

      await service.getRecord('record-123', 'requester-789');

      expect(stellarService.verifyAccessOnChain).toHaveBeenCalledWith('requester-789', 'record-123');
    });
  });
});
