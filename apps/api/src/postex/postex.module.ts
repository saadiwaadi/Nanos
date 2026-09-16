import { Module } from "@nestjs/common";
import { PostexService } from "./postex.service.js";
import { PostexController } from "./postex.controller.js";
import { PostexSchedulerService } from "./postex-scheduler.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
  imports: [PrismaModule],
  controllers: [PostexController],
  providers: [PostexService, PostexSchedulerService],
  exports: [PostexService],
})
export class PostexModule {}
