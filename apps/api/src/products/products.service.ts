import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export type ProductFilters = {
  category?: string;
  sale?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters: ProductFilters = {}) {
    return this.prisma.product.findMany({
      where: {
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.sale ? { isSale: true } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product "${id}" not found`);
    }
    return product;
  }
}
