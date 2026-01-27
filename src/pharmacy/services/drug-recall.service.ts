import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugRecall, RecallStatus } from '../entities/drug-recall.entity';
import { PharmacyInventoryService } from './pharmacy-inventory.service';

@Injectable()
export class DrugRecallService {
  constructor(
    @InjectRepository(DrugRecall)
    private recallRepository: Repository<DrugRecall>,
    private inventoryService: PharmacyInventoryService,
  ) {}

  async create(createDto: Partial<DrugRecall>): Promise<DrugRecall> {
    const recallNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const recall = this.recallRepository.create({
      ...createDto,
      recallNumber,
      status: RecallStatus.INITIATED,
      initiationDate: new Date(),
    });

    return this.recallRepository.save(recall);
  }

  async findAll(): Promise<DrugRecall[]> {
    return this.recallRepository.find({
      relations: ['drug'],
      order: { initiationDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DrugRecall> {
    const recall = await this.recallRepository.findOne({
      where: { id },
      relations: ['drug'],
    });
    if (!recall) {
      throw new NotFoundException(`Drug recall with ID ${id} not found`);
    }
    return recall;
  }

  async update(id: string, updateDto: Partial<DrugRecall>): Promise<DrugRecall> {
    const recall = await this.findOne(id);
    Object.assign(recall, updateDto);
    return this.recallRepository.save(recall);
  }

  async initiateRecall(id: string): Promise<DrugRecall> {
    const recall = await this.findOne(id);
    recall.status = RecallStatus.ONGOING;

    // Find affected inventory and mark as recalled
    const affectedInventory = await this.inventoryService.getInventoryByDrug(recall.drugId);

    for (const inventory of affectedInventory) {
      if (recall.affectedLotNumbers?.includes(inventory.lotNumber)) {
        await this.inventoryService.markAsRecalled(inventory.id, recall.reason);
      }
    }

    return this.recallRepository.save(recall);
  }

  async completeRecall(id: string): Promise<DrugRecall> {
    const recall = await this.findOne(id);
    recall.status = RecallStatus.COMPLETED;
    recall.completionDate = new Date();
    return this.recallRepository.save(recall);
  }

  async getActiveRecalls(): Promise<DrugRecall[]> {
    return this.recallRepository.find({
      where: { status: RecallStatus.ONGOING },
      relations: ['drug'],
      order: { initiationDate: 'DESC' },
    });
  }

  async getRecallsByDrug(drugId: string): Promise<DrugRecall[]> {
    return this.recallRepository.find({
      where: { drugId },
      relations: ['drug'],
      order: { initiationDate: 'DESC' },
    });
  }

  async addAffectedInventory(id: string, inventoryData: any[]): Promise<DrugRecall> {
    const recall = await this.findOne(id);
    recall.affectedInventory = inventoryData;
    return this.recallRepository.save(recall);
  }

  async addActionTaken(id: string, action: string, performedBy: string): Promise<DrugRecall> {
    const recall = await this.findOne(id);
    const actionEntry = {
      date: new Date().toISOString(),
      action,
      performedBy,
    };

    if (!recall.actionsTaken) {
      recall.actionsTaken = [];
    }

    recall.actionsTaken.push(actionEntry);
    return this.recallRepository.save(recall);
  }
}
