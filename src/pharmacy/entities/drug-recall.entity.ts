import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Drug } from './drug.entity';

export enum RecallClassification {
  CLASS_I = 'Class I', // Reasonable probability of serious adverse health consequences or death
  CLASS_II = 'Class II', // May cause temporary or medically reversible adverse health consequences
  CLASS_III = 'Class III', // Not likely to cause adverse health consequences
}

export enum RecallStatus {
  INITIATED = 'initiated',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
}

@Entity('drug_recalls')
export class DrugRecall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  recallNumber: string; // FDA recall number

  @ManyToOne(() => Drug)
  @JoinColumn({ name: 'drug_id' })
  drug: Drug;

  @Column({ type: 'uuid' })
  drugId: string;

  @Column()
  reason: string;

  @Column({
    type: 'enum',
    enum: RecallClassification,
  })
  classification: RecallClassification;

  @Column({
    type: 'enum',
    enum: RecallStatus,
    default: RecallStatus.INITIATED,
  })
  status: RecallStatus;

  @Column({ type: 'date' })
  initiationDate: Date;

  @Column({ type: 'date', nullable: true })
  completionDate: Date;

  @Column({ type: 'simple-array', nullable: true })
  affectedLotNumbers: string[];

  @Column({ type: 'simple-array', nullable: true })
  affectedNdcCodes: string[];

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  fdaRecallUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  affectedInventory: Array<{
    inventoryId: string;
    lotNumber: string;
    quantity: number;
    location: string;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  actionsTaken: Array<{
    date: string;
    action: string;
    performedBy: string;
  }>;

  @Column({ type: 'boolean', default: false })
  requiresPatientNotification: boolean;

  @Column({ type: 'int', default: 0 })
  affectedPatientsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
