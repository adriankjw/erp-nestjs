import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Product } from './products/product.entity';
import { Warehouse } from './inventory/warehouse.entity';
import { StockItem } from './inventory/stock-item.entity';
import { StockMovement } from './inventory/stock-movement.entity';
import { Customer } from './customers/customer.entity';
import { Supplier } from './suppliers/supplier.entity';
import { SalesOrder } from './sales-orders/sales-order.entity';
import { SalesOrderItem } from './sales-orders/sales-order-item.entity';
import { PurchaseOrder } from './purchase-orders/purchase-order.entity';
import { PurchaseOrderItem } from './purchase-orders/purchase-order-item.entity';
import { Invoice } from './invoices/invoice.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || 'erp.sqlite',
  synchronize: true,
  entities: [
    User,
    Product,
    Warehouse,
    StockItem,
    StockMovement,
    Customer,
    Supplier,
    SalesOrder,
    SalesOrderItem,
    PurchaseOrder,
    PurchaseOrderItem,
    Invoice,
  ],
});
