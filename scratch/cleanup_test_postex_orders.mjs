import fetch from "node-fetch";

const token = "ZWM5ODY3ZWQxMTA4NGYxYzljOWIzZjIzN2I2OTc4YTE6NzJkZWUxMmM4MzhlNGVhY2EzOGNmYzQ2NTk3NThjMWQ=";
const baseUrl = "https://api.postex.pk";

const trackingNumbersToCancel = [
  "21122580000029",
  "26122580000030",
  "29122580000028",
];

async function cancelTestOrders() {
  console.log("===============================================================");
  console.log("    POSTEX TEST ORDERS CLEANUP - CANCELLING REAL TRACKINGS    ");
  console.log("===============================================================\n");

  const url = `${baseUrl}/services/integration/api/order/v1/cancel-order`;

  for (const trackingNumber of trackingNumbersToCancel) {
    console.log(`Sending Cancel Request (PUT) for tracking: ${trackingNumber}`);
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackingNumber }),
      });
      const data = await res.json();
      console.log(`Response Status: ${res.status}`);
      console.log(`Response Payload:\n`, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error cancelling tracking ${trackingNumber}:`, err.message);
    }
    console.log("---------------------------------------------------------------\n");
  }
}

cancelTestOrders();
