import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { LabTestParameter } from './lab-test-parameter.entity';

export enum TestCategory {
    HEMATOLOGY = 'hematology',
    CHEMISTRY = 'chemistry',
    MICROBIOLOGY = 'microbiology',
    IMMUNOLOGY = 'immunology',
    MOLECULAR = 'molecular',
    PATHOLOGY = 'pathology',
    URINALYSIS = 'urinalysis',
    TOXICOLOGY = 'toxicology',
    SEROLOGY = 'serology',
    OTHER = 'other',
}

export enum SpecimenType {
    BLOOD = 'blood',
    SERUM = 'serum',
    PLASMA = 'plasma',
    URINE = 'urine',
    STOOL = 'stool',
    CSF = 'csf',
    TISSUE = 'tissue',
    SWAB = 'swab',
    SPUTUM = 'sputum',
    OTHER = 'other',
}

export enum TestStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING_APPROVAL = 'pending_approval',
}

@Entity('lab_tests')
@Index(['testCode'])
@Index(['category', 'status'])
export class LabTest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    @Index()
    testCode: string;

    @Column({ type: 'varchar', length: 200 })
    testName: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: TestCategory,
        default: TestCategory.OTHER,
    })
    category: TestCategory;

    @Column({
        type: 'enum',
        enum: SpecimenType,
    })
    specimenType: SpecimenType;

    @Column({ type: 'varchar', length: 50, nullable: true })
    loincCode: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    cptCode: string;

    @Column({ type: 'int', nullable: true, comment: 'Turnaround time in hours' })
    turnaroundTime: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    cost: number;

    @Column({
        type: 'enum',
        enum: TestStatus,
        default: TestStatus.ACTIVE,
    })
    status: TestStatus;

    @Column({ type: 'text', nullable: true })
    instructions: string;

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
    @OneToMany(() => LabTestParameter, (parameter) => parameter.labTest, {
        cascade: true,
    })
    parameters: LabTestParameter[];
}
