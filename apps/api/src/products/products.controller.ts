import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProductsService } from "./products.service.js";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(
    @Query("category") category?: string,
    @Query("sale") sale?: string,
  ) {
    return this.products.findAll({
      category: category?.trim() || undefined,
      sale: sale === "true" ? true : undefined,
    });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.products.findOne(id);
  }
}
