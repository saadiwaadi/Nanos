import { BadRequestException, Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../admin-auth/admin-jwt.guard.js';
import { AdminSettingsService } from './admin-settings.service.js';

@Controller('admin/settings')
@UseGuards(AdminJwtGuard)
export class AdminSettingsController {
  constructor(private readonly service: AdminSettingsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':category')
  updateThreshold(@Param('category') category: string, @Body('lowStockThreshold') lowStockThreshold: number) {
    if (typeof lowStockThreshold !== 'number' || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      throw new BadRequestException('lowStockThreshold must be an integer >= 0');
    }
    return this.service.updateThreshold(category, lowStockThreshold);
  }
}
