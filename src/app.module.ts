import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqlite',
        database: config.get<string>('DB_PATH') || 'erp.sqlite',
        autoLoadEntities: true,
        synchronize: true, // fine for a mock/demo system; use migrations in production
      }),
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    InventoryModule,
    CustomersModule,
    SuppliersModule,
    SalesOrdersModule,
    PurchaseOrdersModule,
    InvoicesModule,
    DashboardModule,
  ],
})
export class AppModule {}
