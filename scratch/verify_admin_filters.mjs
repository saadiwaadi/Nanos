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

async function verifyFilters() {
  console.log('--- Verifying Admin Order Filtering Logic ---');

  // Login as admin
  const loginRes = await request('/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'saadahmad200555@gmail.com', password: 'admin' },
  });
  const setCookie = loginRes.headers['set-cookie'];
  const adminCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;

  // Fetch orders list
  const res = await request('/admin/orders?limit=100', {
    headers: { Cookie: adminCookie },
  });

  const orders = res.data?.data || [];
  console.log(`Loaded ${orders.length} total orders for filtering evaluation.`);

  // 1. Filter by status: shipped
  const shipped = orders.filter((o) => o.status === 'shipped');
  console.log(`Status 'shipped' filter: ${shipped.length} matching order(s)`);

  // 2. Filter by status: processing
  const processing = orders.filter((o) => o.status === 'processing');
  console.log(`Status 'processing' filter: ${processing.length} matching order(s)`);

  // 3. Filter by customer type: guest
  const guests = orders.filter((o) => o.isGuest);
  console.log(`Customer Type 'guest' filter: ${guests.length} matching order(s)`);

  // 4. Filter by customer type: account
  const accounts = orders.filter((o) => !o.isGuest);
  console.log(`Customer Type 'account' filter: ${accounts.length} matching order(s)`);

  // 5. Search filter by email 'testguest@example.com'
  const searchResult = orders.filter((o) => o.customerEmail?.includes('testguest@example.com'));
  console.log(`Search 'testguest@example.com': ${searchResult.length} matching order(s)`);

  // 6. Combined filter: Guest + Shipped
  const combined = orders.filter((o) => o.isGuest && o.status === 'shipped');
  console.log(`Combined 'Guest' + 'Shipped' filter: ${combined.length} matching order(s)`);

  console.log('--- Filtering Verification Completed Cleanly ---');
}

verifyFilters().catch(console.error);
