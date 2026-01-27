import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('drug_suppliers')
export class DrugSupplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ type: 'simple-json', nullable: true })
  certifications: string[]; // DEA, FDA certifications, etc.

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  reliabilityScore: number; // 0-100 rating

  @Column({ type: 'int', default: 0 })
  averageDeliveryTime: number; // in days

  @Column({ type: 'boolean', default: false })
  isPreferredSupplier: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
