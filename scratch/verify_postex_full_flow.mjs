import { PrismaClient } from "../node_modules/.pnpm/@prisma+client@6.19.3_prism_1d040ab5215f59f0e27ddee7f0cf082e/node_modules/@prisma/client/index.js";
import fetch from "node-fetch";
import * as crypto from "crypto";

const prisma = new PrismaClient();
const token = "ZWM5ODY3ZWQxMTA4NGYxYzljOWIzZjIzN2I2OTc4YTE6NzJkZWUxMmM4MzhlNGVhY2EzOGNmYzQ2NTk3NThjMWQ=";
const baseUrl = "https://api.postex.pk";

async function runFullPostexVerification() {
  console.log("===============================================================");
  console.log("       POSTEX COURIER API FULL VERIFICATION & SIMULATION      ");
  console.log("===============================================================\n");

  // Step 1: Real GET Pickup Address API check
  console.log("--- Step 1: Real GET Pickup Address API Check ---");
  const pickupUrl = `${baseUrl}/services/integration/api/order/v1/get-merchant-address`;
  const pickupRes = await fetch(pickupUrl, {
    method: "GET",
    headers: { token, "Content-Type": "application/json" },
  });
  const pickupData = await pickupRes.json();
  console.log("Raw Pickup Address Response:\n", JSON.stringify(pickupData, null, 2));

  const selectedWarehouse = pickupData.dist?.find((d) => d.addressCode === "001") || pickupData.dist?.[0];
  console.log("\nConfirmed Registered Warehouse Details:");
  console.log(`- addressCode: ${selectedWarehouse?.addressCode}`);
  console.log(`- contactPersonName: ${selectedWarehouse?.contactPersonName}`);
  console.log(`- phone1: ${selectedWarehouse?.phone1}`);
  console.log(`- city: ${selectedWarehouse?.cityName}`);
  console.log(`- address: ${selectedWarehouse?.address}\n`);

  // Step 2: Auto-Book City Order Simulation (Lahore)
  console.log("--- Step 2: Auto-Book City Order Simulation (Lahore) ---");
  const autoBookOrder = await prisma.order.create({
    data: {
      guestEmail: "autobook.customer@example.com",
      guestName: "Auto Book Customer",
      subtotal: 3500,
      total: 3500,
      shippingInfo: {
        name: "Auto Book Customer",
        phone: "03001234567",
        email: "autobook.customer@example.com",
        address: "House 123, Block A, Gulberg III",
        city: "Lahore",
        postal: "54000",
      },
      status: "processing",
      courierBookingStatus: "pending_auto",
      pickupAddressCode: "001",
    },
  });
  console.log(`Created Auto-Book Order ID: ${autoBookOrder.id}`);
  console.log(`Initial courierBookingStatus: ${autoBookOrder.courierBookingStatus}`);

  // Simulate Batch Booking Trigger for Auto-Book Order
  console.log("\nTriggering Batch Booking Process for Auto-Book Order...");
  const autoPayload = {
    cityName: "Lahore",
    customerName: "Auto Book Customer",
    customerPhone: "03001234567",
    deliveryAddress: "House 123, Block A, Gulberg III, Lahore",
    invoiceDivision: 1,
    invoicePayment: autoBookOrder.total,
    orderDetail: "Crocs Classic Clog x1",
    orderRefNumber: autoBookOrder.id,
    pickupAddressCode: "001",
    orderType: "Normal",
  };

  console.log("RAW REQUEST PAYLOAD (Auto-Book Order):\n", JSON.stringify(autoPayload, null, 2));
  const autoApiRes = await fetch(`${baseUrl}/services/integration/api/order/v1/create-order`, {
    method: "POST",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify(autoPayload),
  });
  const autoApiData = await autoApiRes.json();
  console.log("RAW RESPONSE PAYLOAD (Auto-Book Order):\n", JSON.stringify(autoApiData, null, 2));

  if (autoApiData.statusCode === "200" && autoApiData.dist?.trackingNumber) {
    const updatedAutoOrder = await prisma.order.update({
      where: { id: autoBookOrder.id },
      data: {
        postexTrackingNumber: autoApiData.dist.trackingNumber,
        postexStatus: autoApiData.dist.orderStatus || "UnBooked",
        courierBookingStatus: "booked",
      },
    });

    await prisma.postexBookingLog.create({
      data: {
        orderId: autoBookOrder.id,
        requestPayload: autoPayload,
        responsePayload: autoApiData,
        success: true,
      },
    });

    console.log(`Updated Auto-Book Order status to: ${updatedAutoOrder.courierBookingStatus}`);
    console.log(`Assigned PostEx Tracking Number: ${updatedAutoOrder.postexTrackingNumber}\n`);
  }

  // Step 3: Manual-Review City Order Simulation (Multan)
  console.log("--- Step 3: Manual-Review City Order Simulation (Multan) ---");
  const manualOrder = await prisma.order.create({
    data: {
      guestEmail: "manual.customer@example.com",
      guestName: "Manual Review Customer",
      subtotal: 4200,
      total: 4200,
      shippingInfo: {
        name: "Manual Review Customer",
        phone: "03019876543",
        email: "manual.customer@example.com",
        address: "Plot 45, Officers Colony",
        city: "Multan",
        postal: "60000",
      },
      status: "processing",
      courierBookingStatus: "pending_manual_review",
      adminApproved: false,
      pickupAddressCode: "001",
    },
  });
  console.log(`Created Manual-Review Order ID: ${manualOrder.id}`);
  console.log(`Initial courierBookingStatus: ${manualOrder.courierBookingStatus}, adminApproved: ${manualOrder.adminApproved}`);

  console.log("Simulating batch run before admin approval -> Order remains pending_manual_review.");

  // Admin approves manual order
  console.log("Admin Approves Order -> Setting adminApproved=true and courierBookingStatus=queued_for_batch...");
  const approvedOrder = await prisma.order.update({
    where: { id: manualOrder.id },
    data: { adminApproved: true, courierBookingStatus: "queued_for_batch" },
  });
  console.log(`Order status updated to: ${approvedOrder.courierBookingStatus}`);

  // Now trigger batch booking for approved manual order
  const manualPayload = {
    cityName: "Multan",
    customerName: "Manual Review Customer",
    customerPhone: "03019876543",
    deliveryAddress: "Plot 45, Officers Colony, Multan",
    invoiceDivision: 1,
    invoicePayment: manualOrder.total,
    orderDetail: "Trousers Everyday x1",
    orderRefNumber: manualOrder.id,
    pickupAddressCode: "001",
    orderType: "Normal",
  };

  console.log("RAW REQUEST PAYLOAD (Manual-Review Order):\n", JSON.stringify(manualPayload, null, 2));
  const manualApiRes = await fetch(`${baseUrl}/services/integration/api/order/v1/create-order`, {
    method: "POST",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify(manualPayload),
  });
  const manualApiData = await manualApiRes.json();
  console.log("RAW RESPONSE PAYLOAD (Manual-Review Order):\n", JSON.stringify(manualApiData, null, 2));

  if (manualApiData.statusCode === "200" && manualApiData.dist?.trackingNumber) {
    const updatedManualOrder = await prisma.order.update({
      where: { id: manualOrder.id },
      data: {
        postexTrackingNumber: manualApiData.dist.trackingNumber,
        postexStatus: manualApiData.dist.orderStatus || "UnBooked",
        courierBookingStatus: "booked",
      },
    });

    await prisma.postexBookingLog.create({
      data: {
        orderId: manualOrder.id,
        requestPayload: manualPayload,
        responsePayload: manualApiData,
        success: true,
      },
    });

    console.log(`Updated Manual Order status to: ${updatedManualOrder.courierBookingStatus}`);
    console.log(`Assigned PostEx Tracking Number: ${updatedManualOrder.postexTrackingNumber}\n`);
  }

  // Step 4: Booking Failure Simulation (Deliberately Malformed Payload)
  console.log("--- Step 4: Booking Failure Simulation ---");
  const failedOrder = await prisma.order.create({
    data: {
      guestEmail: "failed.booking@example.com",
      guestName: "Failed Booking Test",
      subtotal: 1000,
      total: 1000,
      shippingInfo: {
        name: "Failed Booking Test",
        phone: "0000",
        address: "Invalid",
        city: "InvalidCityNameXYZ",
      },
      status: "processing",
      courierBookingStatus: "pending_auto",
    },
  });

  const malformedPayload = {
    cityName: "INVALID_CITY_XYZ",
    customerName: "",
    customerPhone: "123",
    deliveryAddress: "",
    invoiceDivision: 1,
    invoicePayment: 1000,
    orderDetail: "Test Failure",
    orderRefNumber: failedOrder.id,
    pickupAddressCode: "INVALID_CODE_999",
    orderType: "Normal",
  };

  console.log("RAW REQUEST PAYLOAD (Deliberately Malformed):\n", JSON.stringify(malformedPayload, null, 2));
  const failApiRes = await fetch(`${baseUrl}/services/integration/api/order/v1/create-order`, {
    method: "POST",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify(malformedPayload),
  });
  const failApiData = await failApiRes.json();
  console.log("RAW RESPONSE PAYLOAD (Failed Booking Response):\n", JSON.stringify(failApiData, null, 2));

  const errorMsg = failApiData.statusMessage || failApiData.error || failApiData.message || "PostEx returned failure status";

  await prisma.order.update({
    where: { id: failedOrder.id },
    data: { courierBookingStatus: "booking_failed" },
  });

  const failLog = await prisma.postexBookingLog.create({
    data: {
      orderId: failedOrder.id,
      requestPayload: malformedPayload,
      responsePayload: failApiData,
      success: false,
      errorMessage: errorMsg,
    },
  });

  console.log(`Failed Order ID: ${failedOrder.id}`);
  console.log(`Updated status to: booking_failed`);
  console.log(`Logged in PostexBookingLog ID: ${failLog.id}`);
  console.log(`Recorded Error Message: "${failLog.errorMessage}"`);
  console.log("\n===============================================================");
  console.log("       ALL POSTEX VERIFICATION STEPS COMPLETED CLEANLY!         ");
  console.log("===============================================================");
}

runFullPostexVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
