import fetch from "node-fetch";

const token = "ZWM5ODY3ZWQxMTA4NGYxYzljOWIzZjIzN2I2OTc4YTE6NzJkZWUxMmM4MzhlNGVhY2EzOGNmYzQ2NTk3NThjMWQ=";
const baseUrl = "https://api.postex.pk";
const trackingNumber = "29122580000028";

async function testBulkTrack() {
  console.log("\nTesting Bulk Track Order:");
  const bulkRes = await fetch(`${baseUrl}/services/integration/api/order/v1/track-order`, {
    method: "POST",
    headers: {
      token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([trackingNumber]),
  });
  console.log("Bulk track POST array status:", bulkRes.status, await bulkRes.text());

  const bulkRes2 = await fetch(`${baseUrl}/services/integration/api/order/v1/track-order`, {
    method: "POST",
    headers: {
      token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ trackingNumbers: [trackingNumber] }),
  });
  console.log("Bulk track POST object status:", bulkRes2.status, await bulkRes2.text());
}

testBulkTrack();
