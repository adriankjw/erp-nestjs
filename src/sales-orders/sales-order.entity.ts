import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Warehouse } from '../inventory/warehouse.entity';
import { OrderStatus } from '../common/enums';
import { SalesOrderItem } from './sales-order-item.entity';

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => Customer, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn()
  customer: Customer;

  @ManyToOne(() => Warehouse, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn()
  warehouse: Warehouse;

  @Column({ type: 'varchar', default: OrderStatus.PENDING })
  status: OrderStatus;

  @OneToMany(() => SalesOrderItem, (item) => item.order, { cascade: true, eager: true })
  items: SalesOrderItem[];

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @CreateDateColumn()
  orderDate: Date;
}
