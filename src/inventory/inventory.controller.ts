import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateWarehouseDto, AdjustStockDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Inventory (Warehousing)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post('warehouses')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.service.createWarehouse(dto);
  }

  @Get('warehouses')
  findAllWarehouses() {
    return this.service.findAllWarehouses();
  }

  @Get('stock')
  findAllStock() {
    return this.service.findAllStock();
  }

  @Get('stock/product/:productId')
  findStockByProduct(@Param('productId') productId: string) {
    return this.service.findStockByProduct(productId);
  }

  @Post('stock/adjust')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.service.adjustStock(dto);
  }

  @Get('movements')
  findAllMovements() {
    return this.service.findAllMovements();
  }

  @Get('low-stock')
  getLowStockReport() {
    return this.service.getLowStockReport();
  }
}
