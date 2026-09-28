import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../products/product.entity';
import { Warehouse } from './warehouse.entity';
import { StockMovementType } from '../common/enums';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { eager: true, onDelete: 'CASCADE' })
  product: Product;

  @ManyToOne(() => Warehouse, { eager: true, onDelete: 'CASCADE' })
  warehouse: Warehouse;

  @Column({ type: 'varchar' })
  type: StockMovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
