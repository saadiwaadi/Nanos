import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminOrdersService } from './admin-orders.service.js';
import { AdminJwtGuard } from '../admin-auth/admin-jwt.guard.js';

@Controller('admin/orders')
@UseGuards(AdminJwtGuard)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminOrdersService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminOrdersService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminOrdersService.updateStatus(id, status);
  }
}
