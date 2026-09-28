import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { CreatePurchaseOrderDto } from './dto/purchase-order.dto';
import { Supplier } from '../suppliers/supplier.entity';
import { Product } from '../products/product.entity';
import { Warehouse } from '../inventory/warehouse.entity';
import { InventoryService } from '../inventory/inventory.service';
import { PurchaseOrderStatus, StockMovementType } from '../common/enums';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder) private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem) private itemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
    private inventoryService: InventoryService,
  ) {}

  private async generatePoNumber(): Promise<string> {
    const count = await this.poRepo.count();
    return `PO-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const supplier = await this.supplierRepo.findOne({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const warehouse = await this.warehouseRepo.findOne({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const items: PurchaseOrderItem[] = [];
    let totalAmount = 0;

    for (const line of dto.items) {
      const product = await this.productRepo.findOne({ where: { id: line.productId } });
      if (!product) throw new NotFoundException(`Product ${line.productId} not found`);

      const item = this.itemRepo.create({
        product,
        quantity: line.quantity,
        unitCost: product.costPrice,
        subtotal: product.costPrice * line.quantity,
      });
      totalAmount += item.subtotal;
      items.push(item);
    }

    const po = this.poRepo.create({
      poNumber: await this.generatePoNumber(),
      supplier,
      warehouse,
      status: PurchaseOrderStatus.DRAFT,
      items,
      totalAmount,
    });

    return this.poRepo.save(po);
  }

  findAll(): Promise<PurchaseOrder[]> {
    return this.poRepo.find({ order: { orderDate: 'DESC' } });
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const po = await this.poRepo.findOne({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async markOrdered(id: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft purchase orders can be marked as ordered');
    }
    po.status = PurchaseOrderStatus.ORDERED;
    return this.poRepo.save(po);
  }

  /** Receives goods into the assigned warehouse, increasing stock levels. */
  async receive(id: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    if (po.status !== PurchaseOrderStatus.ORDERED) {
      throw new BadRequestException('Only ordered purchase orders can be received');
    }
    for (const item of po.items) {
      await this.inventoryService.moveStock(
        item.product.id,
        po.warehouse.id,
        StockMovementType.IN,
        item.quantity,
        po.poNumber,
      );
    }
    po.status = PurchaseOrderStatus.RECEIVED;
    return this.poRepo.save(po);
  }

  async cancel(id: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    if (po.status === PurchaseOrderStatus.RECEIVED || po.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('This purchase order can no longer be cancelled');
    }
    po.status = PurchaseOrderStatus.CANCELLED;
    return this.poRepo.save(po);
  }
}
