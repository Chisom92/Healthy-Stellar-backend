import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['action', 'timestamp'])
@Index(['severity', 'timestamp'])
@Index(['entity', 'entityId'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  action: string;

  @Column()
  entity: string;

  @Column({ nullable: true })
  entityId: string;

  @Column('json', { nullable: true })
  details: string;

  @Column()
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ default: false })
  reviewed: boolean;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  resourceId: string;

  @Column({ nullable: true })
  resourceType: string;

  @Column({ nullable: true })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column({ default: false })
  requiresInvestigation: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
