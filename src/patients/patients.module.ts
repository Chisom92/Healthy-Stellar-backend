import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { PatientPrivacyGuard } from './guards/patient-privacy.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]), // register Patient entity
    AuthModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientPrivacyGuard],
  exports: [PatientsService], // so other modules can inject the service
})
export class PatientModule {}
