import fetch from "node-fetch";

const token = "ZWM5ODY3ZWQxMTA4NGYxYzljOWIzZjIzN2I2OTc4YTE6NzJkZWUxMmM4MzhlNGVhY2EzOGNmYzQ2NTk3NThjMWQ=";
const baseUrl = "https://api.postex.pk";

async function testGetMerchantAddress() {
  const url = `${baseUrl}/services/integration/api/order/v1/get-merchant-address`;
  console.log(`Calling PostEx Merchant/Pickup Address API: ${url}`);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "token": token,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Full JSON Response:\n", JSON.stringify(data, null, 2));
}

testGetMerchantAddress();
