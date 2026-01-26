import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { CommonModule } from './common/common.module';
import { PatientModule } from './patients/patients.module';
import { LaboratoryModule } from './laboratory/laboratory.module';
import { DatabaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    // Rate limiting and throttling for security
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    // Application modules
    CommonModule,
    AuthModule,
    BillingModule,
    MedicalRecordsModule,
    PatientModule,
    LaboratoryModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
