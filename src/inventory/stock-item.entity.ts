import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { Product } from '../products/product.entity';
import { Warehouse } from './warehouse.entity';

@Entity('stock_items')
@Index(['product', 'warehouse'], { unique: true })
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { eager: true, onDelete: 'CASCADE' })
  product: Product;

  @ManyToOne(() => Warehouse, { eager: true, onDelete: 'CASCADE' })
  warehouse: Warehouse;

  @Column({ type: 'int', default: 0 })
  quantity: number;
}
