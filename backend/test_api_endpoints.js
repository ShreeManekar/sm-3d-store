const { Socket } = require('net');
const http = require('http');
const app = require('./server');

function testEndpoint(method, path, body, headers = {}) {
  return new Promise((resolve) => {
    const socket = new Socket();
    const req = new http.IncomingMessage(socket);
    const res = new http.ServerResponse(req);
    
    let resData = '';
    res.write = (chunk) => { resData += chunk; return true; };
    res.end = (chunk) => {
      if (chunk) resData += chunk;
      let parsed = resData;
      try { parsed = JSON.parse(resData); } catch (_) {}
      resolve({ status: res.statusCode, headers: res.getHeaders ? res.getHeaders() : {}, data: parsed });
    };

    req.method = method;
    req.url = path;
    req.headers = { host: 'localhost:3000', ...headers };

    const bodyStr = body ? JSON.stringify(body) : '';
    if (body) {
      req.headers['content-type'] = 'application/json';
      req.headers['content-length'] = Buffer.byteLength(bodyStr);
    }

    app(req, res);

    if (bodyStr) {
      req.push(bodyStr);
    }
    req.push(null);
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName}`);
      failed++;
    }
  }

  console.log('\n--- 1. Health Endpoint ---');
  const health = await testEndpoint('GET', '/api/health');
  assert(health.status === 200 && health.data && health.data.status === 'ok', 'GET /api/health returns 200 and status: ok');

  console.log('\n--- 2. Admin Authentication (SM 3D Authentication >> Admin Portal) ---');
  const adminLogin = await testEndpoint('POST', '/api/auth/admin-login', {
    email: 'shreemanekar0@gmail.com',
    password: 'SM3dAdmin@9284'
  });
  assert(adminLogin.status === 200, 'POST /api/auth/admin-login returns 200 OK');
  assert(adminLogin.data && adminLogin.data.adminToken && adminLogin.data.adminToken.startsWith('admintoken_'), 'Admin login returns valid adminToken');
  const adminToken = adminLogin.data ? adminLogin.data.adminToken : '';

  console.log('\n--- 3. Customer Authentication (Sign Up & Sign In) ---');
  const testEmail = `cust_${Date.now()}@example.com`;
  const reg = await testEndpoint('POST', '/api/auth/register', {
    name: 'Jane Customer',
    email: testEmail,
    phone: '9876543210',
    password: 'Password@123',
    street: '123 MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  });
  assert(reg.status === 201, 'POST /api/auth/register returns 201 Created');
  assert(reg.data && reg.data.user && reg.data.user.email === testEmail, 'User returned without password');

  const custLogin = await testEndpoint('POST', '/api/auth/login', {
    email: testEmail,
    password: 'Password@123'
  });
  assert(custLogin.status === 200, 'POST /api/auth/login returns 200 OK');
  assert(custLogin.data && custLogin.data.token, 'Customer login returns session token');

  console.log('\n--- 4. Products Catalog ---');
  const prods = await testEndpoint('GET', '/api/products');
  assert(prods.status === 200 && Array.isArray(prods.data) && prods.data.length > 0, 'GET /api/products returns products list');

  const prodSearch = await testEndpoint('GET', '/api/products?q=dragon');
  assert(prodSearch.status === 200 && Array.isArray(prodSearch.data) && prodSearch.data.length > 0, 'GET /api/products?q=dragon filters properly');

  console.log('\n--- 5. Settings ---');
  const settings = await testEndpoint('GET', '/api/settings');
  assert(settings.status === 200 && settings.data && settings.data.storeName === 'SM 3D Store', 'GET /api/settings returns settings');

  console.log('\n--- 6. Users Directory (Admin Protected) ---');
  const unauthUsers = await testEndpoint('GET', '/api/users');
  assert(unauthUsers.status === 401, 'GET /api/users without token returns 401 Unauthorized');

  const authUsers = await testEndpoint('GET', '/api/users', null, { 'Authorization': `Bearer ${adminToken}` });
  assert(authUsers.status === 200 && Array.isArray(authUsers.data) && authUsers.data.length > 0, 'GET /api/users with adminToken returns users directory');

  console.log('\n--- 7. Catalog Checkout Order ---');
  const newOrder = await testEndpoint('POST', '/api/orders', {
    items: [{ productId: 'prod_1', name: 'Articulated Crystal Dragon', price: 799, quantity: 1 }],
    subtotal: 799,
    shippingFee: 99,
    total: 898,
    userName: 'Jane Customer',
    userEmail: testEmail,
    shippingAddress: { street: '123 MG Road', city: 'Mumbai', pincode: '400001' }
  });
  assert(newOrder.status === 201, 'POST /api/orders creates order (201)');
  assert(newOrder.data && newOrder.data.order && newOrder.data.order.id.startsWith('ORD-'), 'Order ID generated with ORD- prefix');

  console.log('\n--- 8. Custom Print Order ---');
  const custOrder = await testEndpoint('POST', '/api/custom-orders', {
    dimensions: { length: 80, width: 60, height: 40 },
    description: 'Enclosure case for Raspberry Pi',
    desiredMaterial: 'PLA',
    desiredColor: 'White',
    userName: 'Jane Customer',
    userEmail: testEmail
  });
  assert(custOrder.status === 201, 'POST /api/custom-orders creates custom order (201)');

  console.log('\n--- 9. Delete Customer Store Order & Data ---');
  const orderId = newOrder.data.order.id;
  const delOrder = await testEndpoint('DELETE', `/api/orders/${orderId}`, null, { 'Authorization': `Bearer ${adminToken}` });
  assert(delOrder.status === 200, `DELETE /api/orders/${orderId} deletes order (200 OK)`);

  console.log('\n--- 10. Delete Custom Print Order ---');
  const customId = custOrder.data.order.id;
  const delCustom = await testEndpoint('DELETE', `/api/custom-orders/${customId}`, null, { 'Authorization': `Bearer ${adminToken}` });
  assert(delCustom.status === 200, `DELETE /api/custom-orders/${customId} deletes custom order (200 OK)`);

  console.log('\n--- 11. Delete Customer Account ---');
  const userId = reg.data.user.id;
  const delUser = await testEndpoint('DELETE', `/api/users/${userId}`, null, { 'Authorization': `Bearer ${adminToken}` });
  assert(delUser.status === 200, `DELETE /api/users/${userId} deletes customer account (200 OK)`);

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
