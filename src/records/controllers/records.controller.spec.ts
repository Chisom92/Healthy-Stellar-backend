import { Test, TestingModule } from '@nestjs/testing';
import { RecordsController } from './records.controller';
import { RecordsService } from '../services/records.service';

describe('RecordsController', () => {
  let controller: RecordsController;
  let service: any;

  const mockRecordResponse = {
    cid: 'QmTest123',
    encryptedPayload: 'encrypted-data-here',
    metadata: { recordType: 'consultation' },
    stellarTxHash: 'stellar-tx-hash-123',
  };

  beforeEach(async () => {
    service = {
      getRecord: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
      providers: [{ provide: RecordsService, useValue: service }],
    }).compile();

    controller = module.get<RecordsController>(RecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRecord', () => {
    it('should return record response', async () => {
      service.getRecord.mockResolvedValue(mockRecordResponse);

      const req = { user: { id: 'requester-123' } };
      const result = await controller.getRecord('record-456', req);

      expect(result).toEqual(mockRecordResponse);
      expect(service.getRecord).toHaveBeenCalledWith('record-456', 'requester-123');
    });

    it('should use default user ID when user is not authenticated', async () => {
      service.getRecord.mockResolvedValue(mockRecordResponse);

      const req = {};
      await controller.getRecord('record-456', req);

      expect(service.getRecord).toHaveBeenCalledWith(
        'record-456',
        '00000000-0000-0000-0000-000000000000',
      );
    });
  });
});
