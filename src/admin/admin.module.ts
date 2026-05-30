import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../auth/entities/api-key.entity';
import { User } from '../auth/entities/user.entity';
import { AuditLogEntity } from '../common/audit/audit-log.entity';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyService } from '../auth/services/api-key.service';
import { AuditService } from '../common/audit/audit.service';
import { AdminController } from './controllers/admin.controller';
import { AdminPatientsController } from './controllers/admin-patients.controller';
import { PatientModule } from '../patients/patients.module';
import { IpAllowlistGuard } from '../common/guards/ip-allowlist.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApiKeyExpiryTask } from '../auth/tasks/api-key-expiry.task';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ApiKey, User, AuditLogEntity]),
    PatientModule,
    NotificationsModule,
  ],
  controllers: [AdminController, AdminPatientsController],
  providers: [ApiKeyService, AuditService, IpAllowlistGuard, ApiKeyExpiryTask],
  exports: [ApiKeyService],
})
export class AdminModule {}