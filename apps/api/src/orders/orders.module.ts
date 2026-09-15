import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";
import { OrdersEmailService } from "./orders-email.service.js";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersEmailService],
  exports: [OrdersService, OrdersEmailService],
})
export class OrdersModule {}
