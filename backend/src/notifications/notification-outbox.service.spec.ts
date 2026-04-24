import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationOutboxService } from './notification-outbox.service';
import {
  NotificationOutboxEntry,
  OutboxStatus,
} from './entities/notification-outbox.entity';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';

const mockOutboxEntry = (
  overrides?: Partial<NotificationOutboxEntry>,
): NotificationOutboxEntry => ({
  id: 'outbox-1',
  dedupe_key: 'test-key',
  payload: {
    dedupeKey: 'test-key',
    event: 'renewed',
    recipientUserId: 'user-1',
    creatorUserId: 'creator-1',
    subscriptionId: 'sub-1',
    planId: 1,
  },
  status: OutboxStatus.PENDING,
  attempts: 0,
  max_attempts: 5,
  next_attempt_at: null,
  last_error: null,
  notification_id: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const mockNotification = (): Notification => ({
  id: 'notif-1',
  user_id: 'user-1',
  user: null as any,
  type: NotificationType.SUBSCRIPTION_RENEWED,
  title: 'Subscription renewed',
  body: 'Your subscription was renewed',
  is_read: false,
  metadata: null,
  digest_count: 1,
  digest_event_times: null,
  created_at: new Date(),
});

describe('NotificationOutboxService', () => {
  let service: NotificationOutboxService;
  let outboxRepo: jest.Mocked<Repository<NotificationOutboxEntry>>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const mockOutboxRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const mockNotificationsService = {
      deliverNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationOutboxService,
        {
          provide: getRepositoryToken(NotificationOutboxEntry),
          useValue: mockOutboxRepo,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get(NotificationOutboxService);
    outboxRepo = module.get(getRepositoryToken(NotificationOutboxEntry));
    notificationsService = module.get(NotificationsService);
  });

  describe('enqueue', () => {
    it('creates a new outbox entry when dedupe key does not exist', async () => {
      const entry = mockOutboxEntry();
      outboxRepo.findOne.mockResolvedValue(null);
      outboxRepo.create.mockReturnValue(entry);
      outboxRepo.save.mockResolvedValue(entry);

      const result = await service.enqueue('test-key', { foo: 'bar' });

      expect(result).toEqual(entry);
      expect(outboxRepo.create).toHaveBeenCalledWith({
        dedupe_key: 'test-key',
        payload: { foo: 'bar' },
        status: OutboxStatus.PENDING,
        attempts: 0,
        max_attempts: 5,
        next_attempt_at: null,
        last_error: null,
        notification_id: null,
      });
    });

    it('returns existing entry when dedupe key already exists', async () => {
      const existing = mockOutboxEntry({ status: OutboxStatus.COMPLETED });
      outboxRepo.findOne.mockResolvedValue(existing);

      const result = await service.enqueue('test-key', { foo: 'bar' });

      expect(result).toEqual(existing);
      expect(outboxRepo.save).not.toHaveBeenCalled();
    });

    it('handles race condition on unique constraint violation', async () => {
      const existing = mockOutboxEntry();
      outboxRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
      outboxRepo.create.mockReturnValue(mockOutboxEntry());
      outboxRepo.save.mockRejectedValue(
        new Error('duplicate key value violates unique constraint "UQ_notification_outbox_dedupe_key"'),
      );

      const result = await service.enqueue('test-key', { foo: 'bar' });

      expect(result).toEqual(existing);
      expect(outboxRepo.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('sweep', () => {
    it('processes pending entries', async () => {
      const entry = mockOutboxEntry();
      const notification = mockNotification();

      outboxRepo.find.mockResolvedValue([entry]);
      outboxRepo.update.mockResolvedValue({ affected: 1 } as any);
      notificationsService.deliverNotification.mockResolvedValue(notification);

      await service.sweep();

      expect(outboxRepo.find).toHaveBeenCalledWith({
        where: [
          { status: OutboxStatus.PENDING },
          {
            status: OutboxStatus.FAILED,
            next_attempt_at: expect.any(Object),
          },
        ],
        order: { created_at: 'ASC' },
        take: 50,
      });

      expect(outboxRepo.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: expect.objectContaining({ _type: 'in' }) }),
        { status: OutboxStatus.PROCESSING },
      );

      expect(notificationsService.deliverNotification).toHaveBeenCalledWith(entry.payload);

      expect(outboxRepo.update).toHaveBeenCalledWith(entry.id, {
        status: OutboxStatus.COMPLETED,
        notification_id: notification.id,
        last_error: null,
      });
    });

    it('marks entry as failed after max attempts', async () => {
      const entry = mockOutboxEntry({ attempts: 4, max_attempts: 5 });

      outboxRepo.find.mockResolvedValue([entry]);
      outboxRepo.update.mockResolvedValue({ affected: 1 } as any);
      notificationsService.deliverNotification.mockRejectedValue(new Error('DB error'));

      await service.sweep();

      expect(outboxRepo.update).toHaveBeenCalledWith(entry.id, {
        status: OutboxStatus.FAILED,
        attempts: 5,
        last_error: 'DB error',
        next_attempt_at: null,
      });
    });

    it('schedules retry with exponential backoff on failure', async () => {
      const entry = mockOutboxEntry({ attempts: 1 });

      outboxRepo.find.mockResolvedValue([entry]);
      outboxRepo.update.mockResolvedValue({ affected: 1 } as any);
      notificationsService.deliverNotification.mockRejectedValue(new Error('Transient error'));

      await service.sweep();

      expect(outboxRepo.update).toHaveBeenCalledWith(entry.id, {
        status: OutboxStatus.FAILED,
        attempts: 2,
        last_error: 'Transient error',
        next_attempt_at: expect.any(Date),
      });
    });

    it('does not run concurrent sweeps', async () => {
      outboxRepo.find.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      const sweep1 = service.sweep();
      const sweep2 = service.sweep();

      await Promise.all([sweep1, sweep2]);

      // Only one sweep should have called find
      expect(outboxRepo.find).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no entries are pending', async () => {
      outboxRepo.find.mockResolvedValue([]);

      await service.sweep();

      expect(notificationsService.deliverNotification).not.toHaveBeenCalled();
    });
  });
});
