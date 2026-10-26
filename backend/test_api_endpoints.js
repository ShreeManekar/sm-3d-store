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

  console.log('\n--- 12. SQL Injection Firewall Defense ---');
  const sqlPayload1 = await testEndpoint('GET', "/api/products?q=' OR '1'='1'");
  assert(sqlPayload1.status === 403, "GET /api/products?q=' OR '1'='1' blocked by SQL injection shield (403 Forbidden)");

  const sqlPayload2 = await testEndpoint('POST', '/api/auth/login', {
    email: "admin' UNION SELECT * FROM users--",
    password: 'password'
  });
  assert(sqlPayload2.status === 403, 'POST /api/auth/login with SQL injection payload blocked (403 Forbidden)');

  console.log('\n--- 13. Brute-Force & Credential Stuffing Lockout ---');
  const bruteEmail = `brute_${Date.now()}@test.com`;
  let lastStatus = 0;
  for (let i = 0; i < 6; i++) {
    const res = await testEndpoint('POST', '/api/auth/login', { email: bruteEmail, password: 'wrongpassword' }, { 'x-forwarded-for': '198.51.100.99' });
    lastStatus = res.status;
  }
  assert(lastStatus === 429, 'Repeated failed login attempts trigger brute-force lockout (429 Too Many Requests)');

  console.log('\n--- 14. OWASP Security Headers ---');
  const secCheck = await testEndpoint('GET', '/api/health');
  assert(secCheck.headers['x-content-type-options'] === 'nosniff', 'Header X-Content-Type-Options: nosniff is enforced');
  assert(secCheck.headers['x-frame-options'] === 'SAMEORIGIN', 'Header X-Frame-Options: SAMEORIGIN is enforced');

  console.log('\n--- 15. 3D Model Upload (.stl, .3mf) & 100MB Capacity Limits ---');
  // STL Upload
  const dummyStl = "data:application/sla;base64," + Buffer.from("solid test\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid test").toString('base64');
  const uploadStl = await testEndpoint('POST', '/api/upload', {
    filename: 'precision_bracket.stl',
    fileData: dummyStl
  });
  assert(uploadStl.status === 200 && uploadStl.data.fileUrl.endsWith('.stl'), 'POST /api/upload successfully processes .stl models (200 OK)');

  // 3MF Upload
  const dummy3mf = "data:model/3mf;base64," + Buffer.from("PK\x03\x04dummy3mfdata").toString('base64');
  const upload3mf = await testEndpoint('POST', '/api/upload', {
    filename: 'mechanical_assembly.3mf',
    fileData: dummy3mf
  });
  assert(upload3mf.status === 200 && upload3mf.data.fileUrl.endsWith('.3mf'), 'POST /api/upload successfully processes .3mf packages (200 OK)');

  // Large upload (20MB file which failed previously under 15MB limit)
  const large20MbBase64 = "data:application/octet-stream;base64," + Buffer.alloc(20 * 1024 * 1024, 0x41).toString('base64');
  const uploadLarge = await testEndpoint('POST', '/api/upload', {
    filename: 'high_res_sculpture_20mb.stl',
    fileData: large20MbBase64
  });
  assert(uploadLarge.status === 200, 'POST /api/upload accepts large 20MB 3D files (exceeds previous 15MB limit, 200 OK)');

  // Upload exceeding 100MB capacity limit
  const over100MbBase64 = "data:application/octet-stream;base64," + Buffer.alloc(101 * 1024 * 1024, 0x41).toString('base64');
  const uploadExcess = await testEndpoint('POST', '/api/upload', {
    filename: 'giant_model_101mb.stl',
    fileData: over100MbBase64
  });
  assert(uploadExcess.status === 413, 'POST /api/upload rejects files exceeding 100MB capacity limit with HTTP 413');

  console.log('\n--- 16. Delivery Cities Coverage & Management Endpoints ---');
  // 1. Public GET
  const citiesRes = await testEndpoint('GET', '/api/delivery-cities');
  assert(citiesRes.status === 200 && Array.isArray(citiesRes.data.cities) && citiesRes.data.count >= 40, 'GET /api/delivery-cities returns 200 and 40+ deliverable cities');

  // 2. Filter active
  const activeCitiesRes = await testEndpoint('GET', '/api/delivery-cities?active=true');
  assert(activeCitiesRes.status === 200 && activeCitiesRes.data.cities.every(c => c.isActive), 'GET /api/delivery-cities?active=true returns only active cities');

  // 3. Unauthorized POST
  const unauthPost = await testEndpoint('POST', '/api/delivery-cities', { name: 'Test Hub City', state: 'Maharashtra' });
  assert(unauthPost.status === 401, 'POST /api/delivery-cities without admin token returns 401 Unauthorized');

  // 4. Authorized POST
  const testCityName = `Hub_${Date.now()}`;
  const newCityRes = await testEndpoint('POST', '/api/delivery-cities', {
    name: testCityName,
    state: 'Maharashtra',
    turnaround: '1-2 Days',
    pincodes: '442001',
    isActive: true
  }, { 'Authorization': `Bearer ${adminToken}` });
  assert(newCityRes.status === 201 && newCityRes.data.city && newCityRes.data.city.name === testCityName, 'POST /api/delivery-cities creates new delivery city (201 Created)');
  const newCityId = newCityRes.data && newCityRes.data.city ? newCityRes.data.city.id : null;

  // 5. Conflict POST on duplicate
  const dupCityRes = await testEndpoint('POST', '/api/delivery-cities', {
    name: testCityName,
    state: 'Maharashtra'
  }, { 'Authorization': `Bearer ${adminToken}` });
  assert(dupCityRes.status === 409, 'POST /api/delivery-cities rejects duplicate city name with 409 Conflict');

  // 6. Authorized PUT
  if (newCityId) {
    const updateCityRes = await testEndpoint('PUT', `/api/delivery-cities/${newCityId}`, {
      turnaround: 'Same Day Dispatch',
      isActive: false
    }, { 'Authorization': `Bearer ${adminToken}` });
    assert(updateCityRes.status === 200 && updateCityRes.data.city.turnaround === 'Same Day Dispatch' && updateCityRes.data.city.isActive === false, 'PUT /api/delivery-cities/:id updates turnaround and active status');

    // 7. Authorized DELETE
    const deleteCityRes = await testEndpoint('DELETE', `/api/delivery-cities/${newCityId}`, null, { 'Authorization': `Bearer ${adminToken}` });
    assert(deleteCityRes.status === 200 && deleteCityRes.data.success, 'DELETE /api/delivery-cities/:id deletes delivery city (200 OK)');
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
