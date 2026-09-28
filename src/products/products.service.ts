import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { InventoryService } from 'src/inventory/inventory.service';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>, 
      private inventoryService: InventoryService,) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.repo.findOne({ where: { sku: dto.sku } });
    if (existing) throw new ConflictException('SKU already exists');
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.repo.find();
  }

  async findOne(sku: string): Promise<Product> {
    const warehouseId = "767fb69a-8ac1-4bb1-9cdb-0914c7fa93e8";

    const product = await this.repo.findOne({ where: { sku } });
    if (!product) throw new NotFoundException('Product not found');

    const item = await this.inventoryService.getOrCreateStockItem(product.id, warehouseId);

    product.quantity = item.quantity;

    return product;
  }


  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.repo.remove(product);
  }
}
