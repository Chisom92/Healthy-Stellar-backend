import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EncryptionService } from './encryption/encryption.service';
import { AuditService } from './audit/audit.service';
import { IncidentService } from './incident/incident.service';
import { DeviceAuthService } from './device/device-auth.service';
import { RateLimitingService } from './rate-limiting/rate-limiting.service';

import { AuditLog } from './entities/audit-log.entity';
import { SecurityIncident } from './entities/security-incident.entity';
import { MedicalDevice } from './entities/medical-device.entity';
import { BreachNotification } from './entities/breach-notification.entity';
import { AccessPolicy } from './entities/access-policy.entity';

import { HealthcareSecurityMiddleware } from './middleware/healthcare-security.middleware';
import { HipaaHeadersMiddleware } from './middleware/hipaa-headers.middleware';
import { RequestSanitizationMiddleware } from './middleware/request-sanitization.middleware';

import { HealthcareSecurityController } from './healthcare-security.controller';
import { HealthcareRateLimitGuard } from './guards/healthcare-rate-limit.guard';
import { HipaaAccessGuard } from './guards/hipaa-access.guard';
import { DeviceAuthGuard } from './guards/device-auth.guard';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('RATE_LIMIT_TTL', 60),
        limit: config.get<number>('RATE_LIMIT_MAX', 100),
      }),
    }),
    TypeOrmModule.forFeature([
      AuditLog,
      SecurityIncident,
      MedicalDevice,
      BreachNotification,
      AccessPolicy,
    ]),
  ],
  controllers: [HealthcareSecurityController],
  providers: [
    EncryptionService,
    AuditService,
    IncidentService,
    DeviceAuthService,
    RateLimitingService,
    HealthcareRateLimitGuard,
    HipaaAccessGuard,
    DeviceAuthGuard,
  ],
  exports: [
    EncryptionService,
    AuditService,
    IncidentService,
    DeviceAuthService,
    RateLimitingService,
    HipaaAccessGuard,
    DeviceAuthGuard,
  ],
})
export class HealthcareSecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HipaaHeadersMiddleware, RequestSanitizationMiddleware, HealthcareSecurityMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
