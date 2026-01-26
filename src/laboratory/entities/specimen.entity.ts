import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { LabOrder } from './lab-order.entity';

export enum SpecimenStatus {
    COLLECTED = 'collected',
    RECEIVED = 'received',
    PROCESSING = 'processing',
    STORED = 'stored',
    DISCARDED = 'discarded',
    REJECTED = 'rejected',
}

export enum SpecimenTypeEnum {
    BLOOD = 'blood',
    SERUM = 'serum',
    PLASMA = 'plasma',
    URINE = 'urine',
    STOOL = 'stool',
    CSF = 'csf',
    TISSUE = 'tissue',
    SWAB = 'swab',
    SPUTUM = 'sputum',
    SALIVA = 'saliva',
    OTHER = 'other',
}

@Entity('specimens')
@Index(['specimenId'])
@Index(['labOrderId'])
@Index(['status'])
export class Specimen {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    @Index()
    specimenId: string; // Barcode/Accession number

    @Column({ type: 'uuid' })
    labOrderId: string;

    @Column({
        type: 'enum',
        enum: SpecimenTypeEnum,
    })
    specimenType: SpecimenTypeEnum;

    @Column({
        type: 'enum',
        enum: SpecimenStatus,
        default: SpecimenStatus.COLLECTED,
    })
    status: SpecimenStatus;

    @Column({ type: 'timestamp' })
    collectionDate: Date;

    @Column({ type: 'uuid' })
    collectedBy: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    collectedByName: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    collectionSite: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    collectionLocation: string;

    @Column({ type: 'timestamp', nullable: true })
    receivedDate: Date;

    @Column({ type: 'uuid', nullable: true })
    receivedBy: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    receivedByName: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    storageLocation: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    volume: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    volumeUnit: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    containerId: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    containerType: string;

    @Column({
        type: 'jsonb',
        nullable: true,
        comment: 'Chain of custody tracking',
    })
    chainOfCustody: Array<{
        timestamp: Date;
        action: string;
        userId: string;
        userName?: string;
        location?: string;
        notes?: string;
    }>;

    @Column({ type: 'text', nullable: true })
    rejectionReason: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

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
    @ManyToOne(() => LabOrder, (order) => order.specimens, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'labOrderId' })
    labOrder: LabOrder;
}
