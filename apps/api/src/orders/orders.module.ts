import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";
import { OrdersEmailService } from "./orders-email.service.js";
import { PostexModule } from "../postex/postex.module.js";

@Module({
  imports: [PostexModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersEmailService],
  exports: [OrdersService, OrdersEmailService],
})
export class OrdersModule {}
