import { PrismaClient } from "../node_modules/.pnpm/@prisma+client@6.19.3_prism_1d040ab5215f59f0e27ddee7f0cf082e/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();

async function updateDbForCancelledTestOrders() {
  const trackingNumbers = ["21122580000029", "26122580000030", "29122580000028"];
  
  for (const trackingNumber of trackingNumbers) {
    await prisma.order.updateMany({
      where: { postexTrackingNumber: trackingNumber },
      data: {
        postexStatus: "Cancelled",
        courierBookingStatus: "returned",
        status: "cancelled",
      },
    });
  }

  console.log("Database status updated for cancelled test orders.");
}

updateDbForCancelledTestOrders().finally(() => prisma.$disconnect());
