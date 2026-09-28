import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { CreateSalesOrderDto } from './dto/sales-order.dto';
import { Customer } from '../customers/customer.entity';
import { Product } from '../products/product.entity';
import { Warehouse } from '../inventory/warehouse.entity';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatus, StockMovementType } from '../common/enums';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem) private itemRepo: Repository<SalesOrderItem>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
    private inventoryService: InventoryService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const count = await this.orderRepo.count();
    return `SO-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreateSalesOrderDto): Promise<SalesOrder> {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const warehouse = await this.warehouseRepo.findOne({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const items: SalesOrderItem[] = [];
    let totalAmount = 0;

    for (const line of dto.items) {
      const product = await this.productRepo.findOne({ where: { sku: line.sku } });
      if (!product) throw new NotFoundException(`Product ${line.sku} not found`);

      const item = this.itemRepo.create({
        product,
        quantity: line.quantity,
        unitPrice: product.unitPrice,
        subtotal: product.unitPrice * line.quantity,
      });
      totalAmount += item.subtotal;
      items.push(item);
    }

    const order = this.orderRepo.create({
      orderNumber: await this.generateOrderNumber(),
      customer,
      warehouse,
      status: OrderStatus.PENDING,
      items,
      totalAmount,
    });

    for (const item of order.items) {
      await this.inventoryService.moveStock(
        item.product.id,
        order.warehouse.id,
        StockMovementType.OUT,
        item.quantity,
        order.orderNumber,
      );
    }
    order.status = OrderStatus.CONFIRMED;
    return this.orderRepo.save(order);
  }

  findAll(): Promise<SalesOrder[]> {
    return this.orderRepo.find({ order: { orderDate: 'DESC' } });
  }

  async findOne(id: string): Promise<SalesOrder> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Sales order not found');
    return order;
  }

  /** Confirms the order, reserving/deducting stock from the assigned warehouse. */
  async confirm(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be confirmed');
    }
    for (const item of order.items) {
      await this.inventoryService.moveStock(
        item.product.id,
        order.warehouse.id,
        StockMovementType.OUT,
        item.quantity,
        order.orderNumber,
      );
    }
    order.status = OrderStatus.CONFIRMED;
    return this.orderRepo.save(order);
  }

  async ship(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed orders can be shipped');
    }
    order.status = OrderStatus.SHIPPED;
    return this.orderRepo.save(order);
  }

  async deliver(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Only shipped orders can be marked delivered');
    }
    order.status = OrderStatus.DELIVERED;
    return this.orderRepo.save(order);
  }

  /** Cancels an order; if stock had already been deducted (confirmed/shipped), it is restored. */
  async cancel(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('This order can no longer be cancelled');
    }
    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.SHIPPED) {
      for (const item of order.items) {
        await this.inventoryService.moveStock(
          item.product.id,
          order.warehouse.id,
          StockMovementType.IN,
          item.quantity,
          `${order.orderNumber}-CANCEL`,
        );
      }
    }
    order.status = OrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }
}
