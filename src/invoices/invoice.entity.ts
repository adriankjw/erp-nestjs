import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { InvoiceStatus } from '../common/enums';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @ManyToOne(() => SalesOrder, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn()
  order: SalesOrder;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'varchar', default: InvoiceStatus.UNPAID })
  status: InvoiceStatus;

  @CreateDateColumn()
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;
}
