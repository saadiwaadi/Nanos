import http from 'http';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, length: data.length }));
    }).on('error', reject);
  });
}

async function run() {
  const ordersPage = await fetchPage('http://localhost:3001/orders');
  console.log('GET http://localhost:3001/orders -> Status:', ordersPage.status, 'Content length:', ordersPage.length);

  const detailPage = await fetchPage('http://localhost:3001/orders/cmu3833cw0001vdd0snf4d89x');
  console.log('GET http://localhost:3001/orders/cmu3833cw0001vdd0snf4d89x -> Status:', detailPage.status, 'Content length:', detailPage.length);
}

run().catch(console.error);
