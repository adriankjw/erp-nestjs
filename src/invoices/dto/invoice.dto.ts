import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: 'ISO date string, defaults to 14 days from issue' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
