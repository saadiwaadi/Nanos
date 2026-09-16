import http from 'http';

const API = 'http://localhost:4000';

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${API}${path}`);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      },
    );

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('--- Starting Admin Orders Verification ---');

  // 1. Admin Login first to inspect products & variants
  const adminLoginRes = await request('/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'saadahmad200555@gmail.com', password: 'admin' },
  });
  const setCookie = adminLoginRes.headers['set-cookie'];
  const adminCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  console.log('1. Admin Login -> Status:', adminLoginRes.status, 'Cookie:', !!adminCookie);

  if (!adminCookie) {
    console.error('Admin login failed, stopping test.');
    return;
  }

  // 2. Fetch products to get valid variants
  const productsRes = await request('/admin/products', {
    headers: { Cookie: adminCookie },
  });
  const firstProduct = productsRes.data?.[0];
  const firstVariant = firstProduct?.variants?.[0];

  if (!firstProduct || !firstVariant) {
    console.error('No products/variants found in /admin/products!');
    return;
  }

  console.log(`Using Variant: Product=${firstProduct.id} (${firstProduct.name}), Color=${firstVariant.color}, Size=${firstVariant.size}`);

  // 3. Create a guest order with promo
  const guestOrderRes = await request('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      guestEmail: 'testguest@example.com',
      guestName: 'Guest Tester',
      shippingInfo: { address: '123 Main St', city: 'Lahore', phone: '03001234567' },
      promoCode: 'NANOS10',
      items: [{ productId: firstProduct.id, color: firstVariant.color, size: firstVariant.size, qty: 2 }],
    },
  });
  console.log('3. Guest Order Creation:', guestOrderRes.status, 'ID:', guestOrderRes.data?.id);

  // 4. Register a customer to get customer JWT
  const userEmail = `cust_${Date.now()}@example.com`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: userEmail, password: 'Password123!', name: 'Account Tester' },
  });
  const customerToken = regRes.data?.accessToken;
  console.log('4. Customer Registration:', regRes.status, 'Token acquired:', !!customerToken);

  // 5. Create an account order using customer JWT
  const accountOrderRes = await request('/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: {
      shippingInfo: { address: '456 Account Ave', city: 'Karachi', phone: '03009876543' },
      items: [{ productId: firstProduct.id, color: firstVariant.color, size: firstVariant.size, qty: 1 }],
    },
  });
  console.log('5. Account Order Creation:', accountOrderRes.status, 'ID:', accountOrderRes.data?.id);

  // 6. Test Unauthenticated Access -> Expect 401
  const unauthRes = await request('/admin/orders');
  console.log('6. GET /admin/orders without auth -> Status:', unauthRes.status);

  // 7. Test Customer JWT Access -> Expect 401 (AdminJwtGuard blocks non-admin)
  const custAuthRes = await request('/admin/orders', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  console.log('7. GET /admin/orders with customer JWT -> Status:', custAuthRes.status);

  // 8. GET /admin/orders with Admin Cookie -> Expect 200
  const adminOrdersRes = await request('/admin/orders', {
    headers: { Cookie: adminCookie },
  });
  console.log('8. GET /admin/orders with Admin Cookie -> Status:', adminOrdersRes.status, 'Total Orders Count:', adminOrdersRes.data?.data?.length);

  const guestOrderId = guestOrderRes.data?.id;
  const accountOrderId = accountOrderRes.data?.id;

  // 9. GET /admin/orders/:id for Guest Order
  if (guestOrderId) {
    const guestDetailRes = await request(`/admin/orders/${guestOrderId}`, {
      headers: { Cookie: adminCookie },
    });
    console.log('9. GET Guest Order Detail -> Status:', guestDetailRes.status, 'IsGuest:', guestDetailRes.data?.isGuest, 'Email:', guestDetailRes.data?.customerEmail, 'PromoDiscount:', guestDetailRes.data?.discount);
  }

  // 10. GET /admin/orders/:id for Account Order
  if (accountOrderId) {
    const accountDetailRes = await request(`/admin/orders/${accountOrderId}`, {
      headers: { Cookie: adminCookie },
    });
    console.log('10. GET Account Order Detail -> Status:', accountDetailRes.status, 'IsGuest:', accountDetailRes.data?.isGuest, 'Email:', accountDetailRes.data?.customerEmail);
  }

  // 11. PATCH /admin/orders/:id/status
  if (guestOrderId) {
    const patchRes = await request(`/admin/orders/${guestOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: { status: 'shipped' },
    });
    console.log('11. PATCH Status to "shipped" -> Status:', patchRes.status, 'NewStatus:', patchRes.data?.status);
  }

  console.log('--- Verification Complete ---');
}

runVerification().catch(console.error);
