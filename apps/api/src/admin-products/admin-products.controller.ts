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

  @Post(':id/colors')
  addColor(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('hex') hex: string,
    @Body('imagesJson') imagesJson?: string,
  ) {
    return this.service.addColor(id, { name, hex, imagesJson });
  }

  @Patch(':id/colors/:colorId')
  updateColor(
    @Param('id') id: string,
    @Param('colorId') colorId: string,
    @Body() body: { name?: string; hex?: string; imagesJson?: string; sortOrder?: number },
  ) {
    return this.service.updateColor(id, colorId, body);
  }

  @Delete(':id/colors/:colorId')
  removeColor(@Param('id') id: string, @Param('colorId') colorId: string) {
    return this.service.removeColor(id, colorId);
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
