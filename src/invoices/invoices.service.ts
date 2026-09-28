import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { InvoiceStatus } from '../common/enums';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice) private repo: Repository<Invoice>,
    @InjectRepository(SalesOrder) private orderRepo: Repository<SalesOrder>,
  ) {}

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.repo.count();
    return `INV-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Sales order not found');

    const existing = await this.repo.findOne({ where: { order: { id: order.id } } });
    if (existing) throw new BadRequestException('An invoice already exists for this order');

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const invoice = this.repo.create({
      invoiceNumber: await this.generateInvoiceNumber(),
      order,
      amount: order.totalAmount,
      status: InvoiceStatus.UNPAID,
      dueDate,
    });
    return this.repo.save(invoice);
  }

  findAll(): Promise<Invoice[]> {
    return this.repo.find({ order: { issueDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.repo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async markPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }
    invoice.status = InvoiceStatus.PAID;
    invoice.paidDate = new Date();
    return this.repo.save(invoice);
  }

  /** Marks unpaid invoices past their due date as overdue. Useful for a scheduled job or manual trigger. */
  async refreshOverdueStatuses(): Promise<number> {
    const unpaid = await this.repo.find({ where: { status: InvoiceStatus.UNPAID } });
    const now = new Date();
    let updated = 0;
    for (const invoice of unpaid) {
      if (invoice.dueDate && new Date(invoice.dueDate) < now) {
        invoice.status = InvoiceStatus.OVERDUE;
        await this.repo.save(invoice);
        updated++;
      }
    }
    return updated;
  }
}
