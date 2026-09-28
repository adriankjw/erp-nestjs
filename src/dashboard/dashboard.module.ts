import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { SalesOrderItem } from '../sales-orders/sales-order-item.entity';
import { Invoice } from '../invoices/invoice.entity';
import { StockItem } from '../inventory/stock-item.entity';
import { Product } from '../products/product.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder, SalesOrderItem, Invoice, StockItem, Product])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
