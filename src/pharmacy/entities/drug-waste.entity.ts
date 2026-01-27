import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PharmacyInventory } from './pharmacy-inventory.entity';

export enum WasteReason {
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
  CONTAMINATED = 'contaminated',
  RECALLED = 'recalled',
  PREPARATION_ERROR = 'preparation_error',
  PATIENT_RETURN = 'patient_return',
  OTHER = 'other',
}

export enum DisposalMethod {
  INCINERATION = 'incineration',
  LANDFILL = 'landfill',
  RETURN_TO_MANUFACTURER = 'return_to_manufacturer',
  REVERSE_DISTRIBUTOR = 'reverse_distributor',
  OTHER = 'other',
}

@Entity('drug_waste')
export class DrugWaste {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  wasteNumber: string;

  @ManyToOne(() => PharmacyInventory)
  @JoinColumn({ name: 'inventory_id' })
  inventory: PharmacyInventory;

  @Column({ type: 'uuid' })
  inventoryId: string;

  @Column({
    type: 'enum',
    enum: WasteReason,
  })
  reason: WasteReason;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalCost: number;

  @Column({
    type: 'enum',
    enum: DisposalMethod,
  })
  disposalMethod: DisposalMethod;

  @Column({ type: 'date' })
  wasteDate: Date;

  @Column()
  witnessedBy: string; // Staff member who witnessed the disposal

  @Column({ nullable: true })
  documentedBy: string; // Staff member who documented the waste

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  requiresDEAForm: boolean; // For controlled substances

  @Column({ nullable: true })
  deaFormNumber: string;

  @Column({ type: 'simple-json', nullable: true })
  disposalDetails: {
    facilityName?: string;
    facilityAddress?: string;
    manifestNumber?: string;
    disposalCertificate?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
