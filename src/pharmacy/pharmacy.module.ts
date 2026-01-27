import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drug } from './entities/drug.entity';
import { PharmacyInventory } from './entities/pharmacy-inventory.entity';
import { Prescription } from './entities/prescription.entity';
import { PrescriptionItem } from './entities/prescription-item.entity';
import { DrugInteraction } from './entities/drug-interaction.entity';
import { ControlledSubstanceLog } from './entities/controlled-substance-log.entity';
import { SafetyAlert } from './entities/safety-alert.entity';
import { DrugSupplier } from './entities/drug-supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { DrugRecall } from './entities/drug-recall.entity';
import { DrugFormulary } from './entities/drug-formulary.entity';
import { DrugWaste } from './entities/drug-waste.entity';
import { DrugService } from './services/drug.service';
import { PharmacyInventoryService } from './services/pharmacy-inventory.service';
import { PrescriptionService } from './services/prescription.service';
import { DrugInteractionService } from './services/drug-interaction.service';
import { SafetyAlertService } from './services/safety-alert.service';
import { ControlledSubstanceService } from './services/controlled-substance.service';
import { DrugSupplierService } from './services/drug-supplier.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { DrugRecallService } from './services/drug-recall.service';
import { DrugWasteService } from './services/drug-waste.service';
import { InventoryAlertService } from './services/inventory-alert.service';
import { PharmacyController } from './controllers/pharmacy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Drug,
      PharmacyInventory,
      Prescription,
      PrescriptionItem,
      DrugInteraction,
      ControlledSubstanceLog,
      SafetyAlert,
      DrugSupplier,
      PurchaseOrder,
      DrugRecall,
      DrugFormulary,
      DrugWaste,
    ]),
  ],
  controllers: [PharmacyController],
  providers: [
    DrugService,
    PharmacyInventoryService,
    PrescriptionService,
    DrugInteractionService,
    SafetyAlertService,
    ControlledSubstanceService,
    DrugSupplierService,
    PurchaseOrderService,
    DrugRecallService,
    DrugWasteService,
    InventoryAlertService,
  ],
  exports: [
    DrugService,
    PharmacyInventoryService,
    PrescriptionService,
    ControlledSubstanceService,
    DrugSupplierService,
    PurchaseOrderService,
    DrugRecallService,
    DrugWasteService,
    InventoryAlertService,
  ],
})
export class PharmacyModule {}
