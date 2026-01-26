import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { LabTest } from './entities/lab-test.entity';
import { LabTestParameter } from './entities/lab-test-parameter.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { Specimen } from './entities/specimen.entity';
import { LabResult } from './entities/lab-result.entity';
import { LabResultValue } from './entities/lab-result-value.entity';
import { CriticalValueAlert } from './entities/critical-value-alert.entity';
import { QualityControlLog } from './entities/quality-control-log.entity';

// Services
import { LabTestsService } from './services/lab-tests.service';
import { LabOrdersService } from './services/lab-orders.service';
import { SpecimensService } from './services/specimens.service';
import { LabResultsService } from './services/lab-results.service';
import { CriticalAlertsService } from './services/critical-alerts.service';
import { QualityControlService } from './services/quality-control.service';

// Controllers
import { LabTestsController } from './controllers/lab-tests.controller';
import { LabOrdersController } from './controllers/lab-orders.controller';
import { SpecimensController } from './controllers/specimens.controller';
import { LabResultsController } from './controllers/lab-results.controller';
import { QualityControlController } from './controllers/quality-control.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            LabTest,
            LabTestParameter,
            LabOrder,
            LabOrderItem,
            Specimen,
            LabResult,
            LabResultValue,
            CriticalValueAlert,
            QualityControlLog,
        ]),
    ],
    controllers: [
        LabTestsController,
        LabOrdersController,
        SpecimensController,
        LabResultsController,
        QualityControlController,
    ],
    providers: [
        LabTestsService,
        LabOrdersService,
        SpecimensService,
        LabResultsService,
        CriticalAlertsService,
        QualityControlService,
    ],
    exports: [
        LabTestsService,
        LabOrdersService,
        SpecimensService,
        LabResultsService,
        CriticalAlertsService,
        QualityControlService,
    ],
})
export class LaboratoryModule { }
