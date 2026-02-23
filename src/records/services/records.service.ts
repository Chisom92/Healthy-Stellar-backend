import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from '../entities/record.entity';
import { AccessControlService } from '../../access-control/services/access-control.service';
import { StellarService } from '../../stellar/services/stellar.service';
import { IpfsService } from '../../stellar/services/ipfs.service';
import { MedicalCacheService } from '../../performance/medical-cache/medical-cache.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { RecordResponseDto } from '../dto/record-response.dto';

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);
  private readonly ACCESS_CACHE_TTL = 60_000; // 60 seconds

  constructor(
    @InjectRepository(Record)
    private readonly recordRepository: Repository<Record>,
    private readonly accessControlService: AccessControlService,
    private readonly stellarService: StellarService,
    private readonly ipfsService: IpfsService,
    private readonly cacheService: MedicalCacheService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getRecord(recordId: string, requesterId: string): Promise<RecordResponseDto> {
    this.logger.log(`Fetching record ${recordId} for requester ${requesterId}`);

    // Fetch record from database
    const record = await this.recordRepository.findOne({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException(`Record ${recordId} not found`);
    }

    // Check access permission with caching
    const cacheKey = `access:${requesterId}:${recordId}`;
    const hasAccess = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // First check database grants
        const dbAccess = await this.accessControlService.verifyAccess(requesterId, recordId);
        
        if (!dbAccess) {
          return false;
        }

        // Then verify on-chain
        const onChainResult = await this.stellarService.verifyAccessOnChain(requesterId, recordId);
        return onChainResult.hasAccess;
      },
      {
        ttlMs: this.ACCESS_CACHE_TTL,
        category: 'access-control',
        priority: 'high',
        tags: [`requester:${requesterId}`, `record:${recordId}`],
      },
    );

    if (!hasAccess) {
      // Emit audit event for unauthorized access attempt
      await this.auditLogService.log({
        userId: requesterId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entity: 'Record',
        entityId: recordId,
        details: {
          recordId,
          requesterId,
          timestamp: new Date().toISOString(),
        },
        severity: 'HIGH',
      });

      throw new ForbiddenException('Access denied to this record');
    }

    // Fetch encrypted blob from IPFS
    const ipfsBlob = await this.ipfsService.fetch(record.cid);

    // Log successful access
    await this.auditLogService.log({
      userId: requesterId,
      action: 'RECORD_ACCESSED',
      entity: 'Record',
      entityId: recordId,
      details: {
        recordId,
        requesterId,
        cid: record.cid,
        timestamp: new Date().toISOString(),
      },
      severity: 'LOW',
    });

    return {
      cid: ipfsBlob.cid,
      encryptedPayload: ipfsBlob.encryptedPayload,
      metadata: {
        ...record.metadata,
        ...ipfsBlob.metadata,
      },
      stellarTxHash: record.stellarTxHash,
    };
  }
}
