import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../admin-auth/admin-jwt.guard.js';
import { AdminProductsService } from './admin-products.service.js';

@Controller('admin/products')
@UseGuards(AdminJwtGuard)
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/variants/:color/:size')
  updateVariantStock(
    @Param('id') id: string,
    @Param('color') color: string,
    @Param('size') size: string,
    @Body('stock') stock: number,
  ) {
    return this.service.updateVariantStock(id, color, size, stock);
  }

  @Post(':id/variants')
  addVariant(
    @Param('id') id: string,
    @Body('color') color: string,
    @Body('size') size: string,
    @Body('stock') stock: number,
  ) {
    return this.service.addVariant(id, color, size, stock ?? 0);
  }

  @Get('size-charts/:category')
  getSizeChart(@Param('category') category: string) {
    return this.service.getSizeChart(category);
  }

  @Post('size-charts/:category')
  upsertSizeChart(@Param('category') category: string, @Body('rowsJson') rowsJson: string) {
    return this.service.upsertSizeChart(category, rowsJson);
  }
}
