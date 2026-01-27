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

export enum FormularyTier {
  PREFERRED = 'preferred',
  NON_PREFERRED = 'non-preferred',
  NON_FORMULARY = 'non-formulary',
  SPECIALTY = 'specialty',
}

export enum FormularyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired',
}

@Entity('drug_formulary')
export class DrugFormulary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Drug)
  @JoinColumn({ name: 'drug_id' })
  drug: Drug;

  @Column({ type: 'uuid' })
  drugId: string;

  @Column({
    type: 'enum',
    enum: FormularyTier,
    default: FormularyTier.NON_PREFERRED,
  })
  tier: FormularyTier;

  @Column({
    type: 'enum',
    enum: FormularyStatus,
    default: FormularyStatus.ACTIVE,
  })
  status: FormularyStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  copayAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  coinsurancePercentage: number;

  @Column({ type: 'int', nullable: true })
  maxQuantityPerPrescription: number;

  @Column({ type: 'int', nullable: true })
  maxDaysSupply: number;

  @Column({ type: 'int', nullable: true })
  maxRefills: number;

  @Column({ type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  priorAuthorizationRequired: boolean;

  @Column({ nullable: true })
  stepTherapyRequired: boolean;

  @Column({ nullable: true })
  quantityLimitsApply: boolean;

  @Column({ type: 'simple-array', nullable: true })
  alternativeDrugs: string[]; // NDC codes of alternative drugs

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedAnnualCost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
