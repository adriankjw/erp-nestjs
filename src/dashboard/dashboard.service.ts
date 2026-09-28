import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { SalesOrderItem } from '../sales-orders/sales-order-item.entity';
import { Invoice } from '../invoices/invoice.entity';
import { StockItem } from '../inventory/stock-item.entity';
import { Product } from '../products/product.entity';
import { InvoiceStatus, OrderStatus } from '../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem) private orderItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(StockItem) private stockRepo: Repository<StockItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async getSummary() {
    const orders = await this.orderRepo.find();
    const invoices = await this.invoiceRepo.find();
    const stockItems = await this.stockRepo.find();
    const products = await this.productRepo.find();

    const ordersByStatus: Record<string, number> = {};
    for (const status of Object.values(OrderStatus)) {
      ordersByStatus[status] = orders.filter((o) => o.status === status).length;
    }

    const revenue = invoices
      .filter((i) => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + i.amount, 0);

    const outstandingReceivables = invoices
      .filter((i) => i.status === InvoiceStatus.UNPAID || i.status === InvoiceStatus.OVERDUE)
      .reduce((sum, i) => sum + i.amount, 0);

    const inventoryValue = stockItems.reduce(
      (sum, item) => sum + item.quantity * (item.product?.costPrice ?? 0),
      0,
    );

    return {
      totalOrders: orders.length,
      ordersByStatus,
      totalProducts: products.length,
      revenueCollected: revenue,
      outstandingReceivables,
      inventoryValue,
      totalInvoices: invoices.length,
    };
  }

  async getTopSellingProducts(limit = 5) {
    const items = await this.orderItemRepo.find();
    const totals = new Map<string, { productId: string; name: string; sku: string; quantitySold: number; revenue: number }>();

    for (const item of items) {
      const key = item.product.id;
      const existing = totals.get(key);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += item.subtotal;
      } else {
        totals.set(key, {
          productId: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          quantitySold: item.quantity,
          revenue: item.subtotal,
        });
      }
    }

    return Array.from(totals.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);
  }
}
