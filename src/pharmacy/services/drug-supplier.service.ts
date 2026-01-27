import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugSupplier } from '../entities/drug-supplier.entity';

@Injectable()
export class DrugSupplierService {
  constructor(
    @InjectRepository(DrugSupplier)
    private supplierRepository: Repository<DrugSupplier>,
  ) {}

  async create(createDto: Partial<DrugSupplier>): Promise<DrugSupplier> {
    const supplier = this.supplierRepository.create(createDto);
    return this.supplierRepository.save(supplier);
  }

  async findAll(): Promise<DrugSupplier[]> {
    return this.supplierRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DrugSupplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, isActive: true },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async update(id: string, updateDto: Partial<DrugSupplier>): Promise<DrugSupplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, updateDto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    supplier.isActive = false;
    await this.supplierRepository.save(supplier);
  }

  async getPreferredSuppliers(): Promise<DrugSupplier[]> {
    return this.supplierRepository.find({
      where: { isActive: true, isPreferredSupplier: true },
      order: { reliabilityScore: 'DESC' },
    });
  }

  async updateReliabilityScore(id: string, score: number): Promise<DrugSupplier> {
    const supplier = await this.findOne(id);
    supplier.reliabilityScore = score;
    return this.supplierRepository.save(supplier);
  }
}
