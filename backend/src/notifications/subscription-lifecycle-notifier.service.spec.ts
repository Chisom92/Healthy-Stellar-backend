import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '../events/event-bus';
import { InProcessEventBus } from '../events/in-process-event-bus';
import {
  SubscriptionCancelledEvent,
  SubscriptionRenewedEvent,
  SubscriptionRenewalFailedEvent,
} from '../events/domain-events';
import { NotificationOutboxService } from './notification-outbox.service';
import { SubscriptionLifecycleNotifierService } from './subscription-lifecycle-notifier.service';

describe('SubscriptionLifecycleNotifierService', () => {
  let eventBus: InProcessEventBus;
  let outboxService: { enqueue: jest.Mock };

  beforeEach(async () => {
    eventBus = new InProcessEventBus();
    outboxService = {
      enqueue: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionLifecycleNotifierService,
        { provide: EventBus, useValue: eventBus },
        { provide: NotificationOutboxService, useValue: outboxService },
      ],
    }).compile();

    module.get(SubscriptionLifecycleNotifierService).onModuleInit();
  });

  it('enqueues renewed events to the outbox with a stable dedupe key', async () => {
    const event = new SubscriptionRenewedEvent(
      'sub-1',
      'fan-1',
      'creator-1',
      1,
      123456,
      123456,
    );

    eventBus.publish(event);
    await Promise.resolve();

    expect(outboxService.enqueue).toHaveBeenCalledWith(
      'subscription.renewed:sub-1:123456',
      expect.objectContaining({
        dedupeKey: 'subscription.renewed:sub-1:123456',
        event: 'renewed',
        recipientUserId: 'fan-1',
        creatorUserId: 'creator-1',
        subscriptionId: 'sub-1',
        planId: 1,
      }),
    );
  });

  it('enqueues cancelled events to the outbox with a stable dedupe key', async () => {
    const event = new SubscriptionCancelledEvent(
      'sub-2',
      'fan-2',
      'creator-2',
      3,
      654321,
      654321,
    );

    eventBus.publish(event);
    await Promise.resolve();

    expect(outboxService.enqueue).toHaveBeenCalledWith(
      'subscription.cancelled:sub-2:654321',
      expect.objectContaining({
        dedupeKey: 'subscription.cancelled:sub-2:654321',
        event: 'cancelled',
        recipientUserId: 'fan-2',
        creatorUserId: 'creator-2',
      }),
    );
  });

  it('enqueues renewal_failed events to the outbox with a stable dedupe key', async () => {
    const event = new SubscriptionRenewalFailedEvent(
      'sub-3',
      'fan-3',
      'creator-3',
      2,
      'insufficient funds',
      999999,
    );

    eventBus.publish(event);
    await Promise.resolve();

    expect(outboxService.enqueue).toHaveBeenCalledWith(
      'subscription.renewal_failed:sub-3:999999',
      expect.objectContaining({
        dedupeKey: 'subscription.renewal_failed:sub-3:999999',
        event: 'renewal_failed',
        recipientUserId: 'fan-3',
        creatorUserId: 'creator-3',
      }),
    );
  });
});
