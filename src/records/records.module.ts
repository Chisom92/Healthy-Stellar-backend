import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordsController } from './controllers/records.controller';
import { RecordsService } from './services/records.service';
import { Record } from './entities/record.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { StellarModule } from '../stellar/stellar.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Record]),
    AccessControlModule,
    StellarModule,
    ValidationModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
