import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { OrdersService } from "./orders.service.js";
import { CreateOrderDto } from "./dto/order.dto.js";

type AuthedUser = {
  id: string;
  email: string;
  name: string | null;
  googleId: string | null;
};

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @Headers("authorization") authHeader?: string,
  ) {
    return this.ordersService.createOrder(dto, authHeader);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get()
  getUserOrders(@Req() req: Request & { user: AuthedUser }) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(":id/guest")
  getGuestOrderById(
    @Param("id") id: string,
    @Query("email") email?: string,
  ) {
    return this.ordersService.getGuestOrderById(id, email);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  getUserOrderById(
    @Req() req: Request & { user: AuthedUser },
    @Param("id") id: string,
  ) {
    return this.ordersService.getUserOrderById(req.user.id, id);
  }
}
