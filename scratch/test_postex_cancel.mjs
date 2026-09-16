import fetch from "node-fetch";

const token = "ZWM5ODY3ZWQxMTA4NGYxYzljOWIzZjIzN2I2OTc4YTE6NzJkZWUxMmM4MzhlNGVhY2EzOGNmYzQ2NTk3NThjMWQ=";
const baseUrl = "https://api.postex.pk";
const trackingNumber = "29122580000028";

async function testCancelMethods() {
  const methods = ["PUT", "DELETE", "GET"];
  const ep = "/services/integration/api/order/v1/cancel-order";

  for (const method of methods) {
    try {
      let url = `${baseUrl}${ep}`;
      if (method === "GET" || method === "DELETE") {
        url += `?trackingNumber=${trackingNumber}`;
      }
      console.log(`\nTesting ${method} ${url}`);
      const res = await fetch(url, {
        method,
        headers: {
          token,
          "Content-Type": "application/json",
        },
        body: method === "PUT" ? JSON.stringify({ trackingNumber }) : undefined,
      });
      const text = await res.text();
      console.log(`Status: ${res.status}`);
      console.log(`Response: ${text.slice(0, 300)}`);
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }

  // Also test track-order single + bulk
  console.log("\nTesting Track Order single:");
  const trackRes = await fetch(`${baseUrl}/services/integration/api/order/v1/track-order/${trackingNumber}`, {
    headers: { token },
  });
  console.log("Track single status:", trackRes.status, await trackRes.text());
}

testCancelMethods();
