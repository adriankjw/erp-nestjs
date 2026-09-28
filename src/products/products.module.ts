import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { InventoryModule } from 'src/inventory/inventory.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]),
    forwardRef(() => InventoryModule)],
  controllers: [ProductsController],
  providers: [ProductsService,],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule { }
