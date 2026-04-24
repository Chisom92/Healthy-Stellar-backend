import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsModule } from '../events/events.module';
import { Notification } from './entities/notification.entity';
import { NotificationOutboxEntry } from './entities/notification-outbox.entity';
import { NotificationsController } from './notifications.controller';
import { SubscriptionLifecycleNotifierService } from './subscription-lifecycle-notifier.service';
import { NotificationsService } from './notifications.service';
import { NotificationOutboxService } from './notification-outbox.service';

@Module({
  imports: [
    EventsModule,
    ConfigModule,
    ScheduleModule,
    TypeOrmModule.forFeature([Notification, NotificationOutboxEntry]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationOutboxService,
    SubscriptionLifecycleNotifierService,
  ],
  exports: [NotificationsService, NotificationOutboxService],
})
export class NotificationsModule {}
