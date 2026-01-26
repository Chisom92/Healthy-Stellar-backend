import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { LabOrderItem } from './lab-order-item.entity';
import { Specimen } from './specimen.entity';

export enum OrderStatus {
    ORDERED = 'ordered',
    COLLECTED = 'collected',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    VERIFIED = 'verified',
    CANCELLED = 'cancelled',
}

export enum OrderPriority {
    ROUTINE = 'routine',
    URGENT = 'urgent',
    STAT = 'stat',
}

@Entity('lab_orders')
@Index(['orderNumber'])
@Index(['patientId', 'orderDate'])
@Index(['status', 'priority'])
export class LabOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    @Index()
    orderNumber: string;

    @Column({ type: 'uuid' })
    @Index()
    patientId: string;

    @Column({ type: 'varchar', length: 200 })
    patientName: string;

    @Column({ type: 'uuid' })
    orderingProviderId: string;

    @Column({ type: 'varchar', length: 200 })
    orderingProviderName: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.ORDERED,
    })
    status: OrderStatus;

    @Column({
        type: 'enum',
        enum: OrderPriority,
        default: OrderPriority.ROUTINE,
    })
    priority: OrderPriority;

    @Column({ type: 'timestamp' })
    orderDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    collectionDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    verifiedDate: Date;

    @Column({ type: 'text', nullable: true })
    clinicalIndication: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    departmentId: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    departmentName: string;

    @Column({ type: 'uuid', nullable: true })
    cancelledBy: string;

    @Column({ type: 'timestamp', nullable: true })
    cancelledDate: Date;

    @Column({ type: 'text', nullable: true })
    cancellationReason: string;

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
    @OneToMany(() => LabOrderItem, (item) => item.labOrder, {
        cascade: true,
    })
    items: LabOrderItem[];

    @OneToMany(() => Specimen, (specimen) => specimen.labOrder, {
        cascade: true,
    })
    specimens: Specimen[];
}
