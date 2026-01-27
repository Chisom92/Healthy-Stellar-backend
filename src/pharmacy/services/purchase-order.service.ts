import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from '../entities/purchase-order.entity';
import { DrugSupplierService } from './drug-supplier.service';
import { PharmacyInventoryService } from './pharmacy-inventory.service';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private orderRepository: Repository<PurchaseOrder>,
    private supplierService: DrugSupplierService,
    private inventoryService: PharmacyInventoryService,
  ) {}

  async create(createDto: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    // Verify supplier exists
    await this.supplierService.findOne(createDto.supplierId);

    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const order = this.orderRepository.create({
      ...createDto,
      orderNumber,
      status: PurchaseOrderStatus.DRAFT,
    });

    return this.orderRepository.save(order);
  }

  async findAll(): Promise<PurchaseOrder[]> {
    return this.orderRepository.find({
      relations: ['supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['supplier'],
    });
    if (!order) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateDto: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    Object.assign(order, updateDto);
    return this.orderRepository.save(order);
  }

  async approveOrder(id: string, approvedBy: string): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    order.status = PurchaseOrderStatus.APPROVED;
    order.approvedBy = approvedBy;
    order.approvedAt = new Date();
    return this.orderRepository.save(order);
  }

  async markAsOrdered(id: string): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    order.status = PurchaseOrderStatus.ORDERED;
    return this.orderRepository.save(order);
  }

  async receiveOrder(id: string, receivedItems: any[]): Promise<PurchaseOrder> {
    const order = await this.findOne(id);

    // Update inventory for each received item
    for (const item of receivedItems) {
      await this.inventoryService.addInventoryFromPurchase({
        drugId: item.drugId,
        quantity: item.quantity,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate,
        unitCost: item.unitCost,
        supplierId: order.supplierId,
        purchaseOrderNumber: order.orderNumber,
      });
    }

    // Update order status
    if (receivedItems.length === order.items.length) {
      order.status = PurchaseOrderStatus.RECEIVED;
    } else {
      order.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
    }

    order.actualDeliveryDate = new Date();
    return this.orderRepository.save(order);
  }

  async getPendingOrders(): Promise<PurchaseOrder[]> {
    return this.orderRepository.find({
      where: { status: PurchaseOrderStatus.PENDING },
      relations: ['supplier'],
      order: { createdAt: 'ASC' },
    });
  }

  async getOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return this.orderRepository.find({
      where: { supplierId },
      relations: ['supplier'],
      order: { createdAt: 'DESC' },
    });
  }
}
