import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Dashboard (Reports)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getSummary() {
    return this.service.getSummary();
  }

  @Get('top-selling-products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getTopSellingProducts(@Query('limit') limit?: string) {
    return this.service.getTopSellingProducts(limit ? parseInt(limit, 10) : undefined);
  }
}
