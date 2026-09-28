import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersController } from './sales-orders.controller';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { Warehouse } from '../inventory/warehouse.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder, SalesOrderItem, Warehouse]),
    CustomersModule,
    ProductsModule,
    InventoryModule,
  ],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
  exports: [SalesOrdersService, TypeOrmModule],
})
export class SalesOrdersModule {}
