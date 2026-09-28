import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { StockItem } from './stock-item.entity';
import { StockMovement } from './stock-movement.entity';
import { Product } from '../products/product.entity';
import { CreateWarehouseDto, AdjustStockDto } from './dto/inventory.dto';
import { StockMovementType } from '../common/enums';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(StockItem) private stockItemRepo: Repository<StockItem>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  // ---- Warehouses ----
  createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse> {
    return this.warehouseRepo.save(this.warehouseRepo.create(dto));
  }

  findAllWarehouses(): Promise<Warehouse[]> {
    return this.warehouseRepo.find();
  }

  // ---- Stock levels ----
  findAllStock(): Promise<StockItem[]> {
    return this.stockItemRepo.find();
  }

  findStockByProduct(productId: string): Promise<StockItem[]> {
    return this.stockItemRepo.find({ where: { product: { id: productId } } });
  }

  async getTotalQuantity(productId: string): Promise<number> {
    const items = await this.findStockByProduct(productId);
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }

  private async getOrCreateStockItem(productId: string, warehouseId: string): Promise<StockItem> {
    let item = await this.stockItemRepo.findOne({
      where: { product: { id: productId }, warehouse: { id: warehouseId } },
    });
    if (!item) {
      const product = await this.productRepo.findOne({ where: { id: productId } });
      const warehouse = await this.warehouseRepo.findOne({ where: { id: warehouseId } });
      if (!product) throw new NotFoundException('Product not found');
      if (!warehouse) throw new NotFoundException('Warehouse not found');
      item = this.stockItemRepo.create({ product, warehouse, quantity: 0 });
      item = await this.stockItemRepo.save(item);
    }
    return item;
  }

  /** Records a stock movement and updates the stock item quantity accordingly. */
  async adjustStock(dto: AdjustStockDto): Promise<StockItem> {
    const item = await this.getOrCreateStockItem(dto.productId, dto.warehouseId);

    if (dto.type === StockMovementType.IN) {
      item.quantity += dto.quantity;
    } else if (dto.type === StockMovementType.OUT) {
      if (item.quantity < dto.quantity) {
        throw new BadRequestException('Insufficient stock for this movement');
      }
      item.quantity -= dto.quantity;
    } else {
      // ADJUST sets the quantity directly
      item.quantity = dto.quantity;
    }

    await this.stockItemRepo.save(item);

    const movement = this.movementRepo.create({
      product: item.product,
      warehouse: item.warehouse,
      type: dto.type,
      quantity: dto.quantity,
      reference: dto.reference,
      note: dto.note,
    });
    await this.movementRepo.save(movement);

    return item;
  }

  /** Internal helper used by sales/purchase orders to move stock without extra validation noise. */
  async moveStock(productId: string, warehouseId: string, type: StockMovementType, quantity: number, reference?: string) {
    return this.adjustStock({ productId, warehouseId, type, quantity, reference });
  }

  findAllMovements(): Promise<StockMovement[]> {
    return this.movementRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getLowStockReport(): Promise<any[]> {
    const products = await this.productRepo.find();
    const results = [];
    for (const product of products) {
      const total = await this.getTotalQuantity(product.id);
      if (total <= product.reorderLevel) {
        results.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          totalQuantity: total,
          reorderLevel: product.reorderLevel,
        });
      }
    }
    return results;
  }
}
