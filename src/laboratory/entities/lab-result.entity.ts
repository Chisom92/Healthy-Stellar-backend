import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { LabOrderItem } from './lab-order-item.entity';
import { LabResultValue } from './lab-result-value.entity';

export enum ResultStatus {
    PRELIMINARY = 'preliminary',
    FINAL = 'final',
    CORRECTED = 'corrected',
    CANCELLED = 'cancelled',
    AMENDED = 'amended',
}

@Entity('lab_results')
@Index(['orderItemId'])
@Index(['status'])
export class LabResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    orderItemId: string;

    @Column({
        type: 'enum',
        enum: ResultStatus,
        default: ResultStatus.PRELIMINARY,
    })
    status: ResultStatus;

    @Column({ type: 'timestamp' })
    performedDate: Date;

    @Column({ type: 'uuid' })
    performedBy: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    performedByName: string;

    @Column({ type: 'uuid', nullable: true })
    verifiedBy: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    verifiedByName: string;

    @Column({ type: 'timestamp', nullable: true })
    verifiedDate: Date;

    @Column({ type: 'text', nullable: true })
    resultNotes: string;

    @Column({ type: 'text', nullable: true })
    interpretation: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    instrumentId: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    instrumentName: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    methodId: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    methodName: string;

    @Column({ type: 'boolean', default: false })
    hasCriticalValues: boolean;

    @Column({ type: 'boolean', default: false })
    hasDeltaCheck: boolean;

    @Column({ type: 'text', nullable: true })
    correctionReason: string;

    @Column({ type: 'uuid', nullable: true })
    correctedBy: string;

    @Column({ type: 'timestamp', nullable: true })
    correctedDate: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'uuid', nullable: true })
    createdBy: string;

    @Column({ type: 'uuid', nullable: true })
    updatedBy: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @OneToOne(() => LabOrderItem, (item) => item.result, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'orderItemId' })
    orderItem: LabOrderItem;

    @OneToMany(() => LabResultValue, (value) => value.labResult, {
        cascade: true,
    })
    values: LabResultValue[];
}
