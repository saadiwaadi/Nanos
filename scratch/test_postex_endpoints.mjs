import fetch from "node-fetch";

const token = "ZWM5ODY3ZWQxMTA4NGYxYzljOWIzZjIzN2I2OTc4YTE6NzJkZWUxMmM4MzhlNGVhY2EzOGNmYzQ2NTk3NThjMWQ=";
const baseUrl = "https://api.postex.pk";

async function testEndpoints() {
  console.log("Testing PostEx API endpoints...");

  // Test create-order with deliberate test/validation payload
  const createUrl = `${baseUrl}/services/integration/api/order/v1/create-order`;
  console.log(`\nPOST ${createUrl}`);
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      "token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cityName: "Lahore",
      customerName: "Test Customer",
      customerPhone: "03001234567",
      deliveryAddress: "Test Address Lahore",
      invoiceDivision: 1,
      invoicePayment: 100,
      orderDetail: "Test Order Item",
      orderRefNumber: "TEST-REF-001",
      pickupAddressCode: "001",
      orderType: "Normal",
    }),
  });
  const createText = await createRes.text();
  console.log("Create Order Status:", createRes.status);
  console.log("Create Order Response:", createText);
}

testEndpoints();
