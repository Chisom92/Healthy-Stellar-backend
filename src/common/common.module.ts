import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './services/audit-log.service';
import { DataEncryptionService } from './services/data-encryption.service';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { AuditContextGuard } from './guards/audit-context.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    AuditLogService,
    DataEncryptionService,
    {
      provide: 'DATA_SOURCE',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [DataSource],
    },
    AuditSubscriber,
    AuditContextGuard,
  ],
  exports: [AuditLogService, DataEncryptionService, AuditSubscriber, AuditContextGuard],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
