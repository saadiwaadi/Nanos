import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service.js";
import { Queue, Worker, type ConnectionOptions, type Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service.js";

export const ORDER_EMAIL_QUEUE = "order-emails";

@Global()
@Module({
  providers: [
    {
      provide: ORDER_EMAIL_QUEUE,
      useFactory: (redis: RedisService) => {
        return new Queue(ORDER_EMAIL_QUEUE, {
          connection: redis.getClient().duplicate(),
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
            removeOnComplete: 10,
            removeOnFail: 100,
          },
        });
      },
      inject: [RedisService],
    },
    {
      provide: "OrderEmailWorker",
      useFactory: (connection: ConnectionOptions) => {
        const worker = new Worker(
          ORDER_EMAIL_QUEUE,
          async (job) => {
            // TODO: replace stub with real email dispatch once an email provider is chosen.
            console.log("[BullMQ] order-emails job", {
              jobId: job.id,
              orderId: job.data.orderId,
              to: job.data.email,
            });
            return { ok: true, sentAt: new Date().toISOString() };
          },
          { connection, concurrency: 1 }
        );

        worker.on("failed", (job: Job | undefined, err: Error) => {
          console.error("[BullMQ] order-emails job failed", {
            jobId: job?.id,
            orderId: job?.data?.orderId,
            error: err.message,
          });
        });

        return worker;
      },
      inject: [RedisService],
    },
  ],
  exports: [ORDER_EMAIL_QUEUE],
})
export class BullModule {}

// Optional: enable the processor only once we confirm the email channel.
// Right now it's a no-op worker that proves the pipeline.
