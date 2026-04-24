import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '../events/event-bus';
import {
  SubscriptionCancelledEvent,
  SubscriptionRenewedEvent,
  SubscriptionRenewalFailedEvent,
} from '../events/domain-events';
import { NotificationOutboxService } from './notification-outbox.service';
import { SubscriptionLifecycleNotificationRequest } from './notifications.service';

/**
 * Listens to subscription domain events and persists each one to the
 * notification outbox, guaranteeing at-least-once delivery even if the
 * process crashes before the notification is written to the DB.
 */
@Injectable()
export class SubscriptionLifecycleNotifierService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionLifecycleNotifierService.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly outboxService: NotificationOutboxService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe(
      'subscription.renewed',
      (event: SubscriptionRenewedEvent) => {
        const request: SubscriptionLifecycleNotificationRequest = {
          dedupeKey: `subscription.renewed:${event.subscriptionId}:${event.expiry}`,
          event: 'renewed',
          recipientUserId: event.fan,
          creatorUserId: event.creator,
          creatorDisplayName: event.creator,
          subscriptionId: event.subscriptionId,
          planId: event.planId,
          occurredAt: new Date(event.timestamp),
        };
        void this.outboxService
          .enqueue(request.dedupeKey, request as unknown as Record<string, unknown>)
          .catch((err: unknown) =>
            this.logger.error(
              `Failed to enqueue renewed notification: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
      },
    );

    this.eventBus.subscribe(
      'subscription.cancelled',
      (event: SubscriptionCancelledEvent) => {
        const request: SubscriptionLifecycleNotificationRequest = {
          dedupeKey: `subscription.cancelled:${event.subscriptionId}:${event.cancelledAt}`,
          event: 'cancelled',
          recipientUserId: event.fan,
          creatorUserId: event.creator,
          creatorDisplayName: event.creator,
          subscriptionId: event.subscriptionId,
          planId: event.planId,
          occurredAt: new Date(event.timestamp),
        };
        void this.outboxService
          .enqueue(request.dedupeKey, request as unknown as Record<string, unknown>)
          .catch((err: unknown) =>
            this.logger.error(
              `Failed to enqueue cancelled notification: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
      },
    );

    this.eventBus.subscribe(
      'subscription.renewal_failed',
      (event: SubscriptionRenewalFailedEvent) => {
        const request: SubscriptionLifecycleNotificationRequest = {
          dedupeKey: `subscription.renewal_failed:${event.subscriptionId}:${event.timestamp}`,
          event: 'renewal_failed',
          recipientUserId: event.fan,
          creatorUserId: event.creator,
          creatorDisplayName: event.creator,
          subscriptionId: event.subscriptionId,
          planId: event.planId,
          occurredAt: new Date(event.timestamp),
        };
        void this.outboxService
          .enqueue(request.dedupeKey, request as unknown as Record<string, unknown>)
          .catch((err: unknown) =>
            this.logger.error(
              `Failed to enqueue renewal_failed notification: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
      },
    );
  }
}
