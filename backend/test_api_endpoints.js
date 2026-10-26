const { Socket } = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./server');

const DB_FILE = path.resolve(__dirname, '../data/db.json');

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
  const dbBackup = fs.readFileSync(DB_FILE, 'utf-8');
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

  console.log('\n--- 15. 3D Model Upload (.stl, .3mf) & 200MB Capacity Limits ---');
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

  // STEP CAD Upload
  const dummyStep = "data:application/step;base64," + Buffer.from("ISO-10303-21;\nHEADER;\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;").toString('base64');
  const uploadStep = await testEndpoint('POST', '/api/upload', {
    filename: 'precision_chassis.step',
    fileData: dummyStep
  });
  assert(uploadStep.status === 200 && uploadStep.data.fileUrl.endsWith('.step'), 'POST /api/upload successfully processes .step CAD files (200 OK)');

  // Large upload (20MB file which failed previously under 15MB limit)
  const large20MbBase64 = "data:application/octet-stream;base64," + Buffer.alloc(20 * 1024 * 1024, 0x41).toString('base64');
  const uploadLarge = await testEndpoint('POST', '/api/upload', {
    filename: 'high_res_sculpture_20mb.stl',
    fileData: large20MbBase64
  });
  assert(uploadLarge.status === 200, 'POST /api/upload accepts large 20MB 3D files (exceeds previous 15MB limit, 200 OK)');

  // Upload exceeding 200MB capacity limit
  const over200MbBase64 = "data:application/octet-stream;base64," + Buffer.alloc(201 * 1024 * 1024, 0x41).toString('base64');
  const uploadExcess = await testEndpoint('POST', '/api/upload', {
    filename: 'giant_model_201mb.stl',
    fileData: over200MbBase64
  });
  assert(uploadExcess.status === 413, 'POST /api/upload rejects files exceeding 200MB capacity limit with HTTP 413');

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

  console.log('\n--- 17. Materials Matrix Guide ---');
  const materialsRes = await testEndpoint('GET', '/api/materials');
  assert(materialsRes.status === 200 && Array.isArray(materialsRes.data) && materialsRes.data.length >= 5, 'GET /api/materials returns 200 and comprehensive materials guide');
  assert(materialsRes.data.some(m => m.shortCode === 'PLA') && materialsRes.data.some(m => m.shortCode === 'CF-PETG'), 'Materials guide includes PLA and CF-PETG technical metrics');

  console.log('\n--- 18. Customer Reviews & Showcase ---');
  const reviewsRes = await testEndpoint('GET', '/api/reviews');
  assert(reviewsRes.status === 200 && Array.isArray(reviewsRes.data) && reviewsRes.data.length > 0, 'GET /api/reviews returns customer showcase reviews');

  const addReviewRes = await testEndpoint('POST', '/api/reviews', {
    customerName: 'Karan Patel',
    productName: 'Mechanical Bevel Gear',
    rating: 5,
    review: 'Smooth print, precise tolerances right off the bed.',
    material: 'PETG'
  });
  assert(addReviewRes.status === 201 && addReviewRes.data.review.customerName === 'Karan Patel', 'POST /api/reviews successfully creates customer review');

  console.log('\n--- 19. Real-Time Production Order Tracking ---');
  const trackRes = await testEndpoint('GET', '/api/track/ORD-2026-8801');
  assert(trackRes.status === 200 && trackRes.data && trackRes.data.stages.length === 7, 'GET /api/track/:orderId returns 7-stage production tracking pipeline');
  assert(trackRes.data.courierPartner && trackRes.data.trackingNumber, 'Order tracking includes courier partner and AWB tracking number');

  console.log('\n--- 20. Enterprise RFQ & Bulk Inquiries ---');
  const rfqRes = await testEndpoint('POST', '/api/rfq', {
    companyName: 'Apex Robotics Labs',
    contactName: 'Sanjay Verma',
    email: 'sanjay@apexrobotics.in',
    phone: '9822012345',
    quantity: 100,
    material: 'Carbon Fiber PETG',
    targetDate: 'Within 10 Days',
    projectNotes: 'Need 100 pcs precision mounting brackets.',
    ndaRequired: true
  });
  assert(rfqRes.status === 201 && rfqRes.data && rfqRes.data.rfq.id.startsWith('RFQ-'), 'POST /api/rfq creates enterprise RFQ (201 Created)');

  console.log('\n--- 21. FAQs Knowledge Base ---');
  const faqsRes = await testEndpoint('GET', '/api/faqs');
  assert(faqsRes.status === 200 && Array.isArray(faqsRes.data) && faqsRes.data.length >= 4, 'GET /api/faqs returns knowledge base and DFAM guide');

  console.log('\n--- 22. Strict Admin Data Protection (Orders, RFQs, Financial Summary) ---');
  const unauthOrders = await testEndpoint('GET', '/api/orders');
  assert(unauthOrders.status === 401, 'GET /api/orders without token returns 401 Unauthorized');

  const authOrders = await testEndpoint('GET', '/api/orders', null, { 'Authorization': `Bearer ${adminToken}` });
  assert(authOrders.status === 200 && Array.isArray(authOrders.data), 'GET /api/orders with adminToken returns orders array');

  const unauthCustom = await testEndpoint('GET', '/api/custom-orders');
  assert(unauthCustom.status === 401, 'GET /api/custom-orders without token returns 401 Unauthorized');

  const authCustom = await testEndpoint('GET', '/api/custom-orders', null, { 'Authorization': `Bearer ${adminToken}` });
  assert(authCustom.status === 200 && Array.isArray(authCustom.data), 'GET /api/custom-orders with adminToken returns custom orders array');

  const unauthRfq = await testEndpoint('GET', '/api/rfq');
  assert(unauthRfq.status === 401, 'GET /api/rfq without token returns 401 Unauthorized');

  const authRfq = await testEndpoint('GET', '/api/rfq', null, { 'Authorization': `Bearer ${adminToken}` });
  assert(authRfq.status === 200 && Array.isArray(authRfq.data), 'GET /api/rfq with adminToken returns RFQs list');

  const unauthFinance = await testEndpoint('GET', '/api/admin/financial-summary');
  assert(unauthFinance.status === 401, 'GET /api/admin/financial-summary without token returns 401 Unauthorized');

  const authFinance = await testEndpoint('GET', '/api/admin/financial-summary', null, { 'Authorization': `Bearer ${adminToken}` });
  assert(authFinance.status === 200 && authFinance.data && typeof authFinance.data.totalRevenue === 'number', 'GET /api/admin/financial-summary with adminToken returns financial statement');

  // Test review moderation protection
  const unauthReviewList = await testEndpoint('GET', '/api/reviews');
  assert(unauthReviewList.status === 200 && Array.isArray(unauthReviewList.data), 'Public GET /api/reviews returns approved reviews');
  const authReviewList = await testEndpoint('GET', '/api/reviews', null, { 'Authorization': `Bearer ${adminToken}` });
  assert(authReviewList.status === 200 && Array.isArray(authReviewList.data), 'Admin GET /api/reviews returns full review catalog');

  console.log('\n--- 23. Batch Delete Products & No-Reseed Empty State ---');
  const unauthDeleteAll = await testEndpoint('DELETE', '/api/products');
  assert(unauthDeleteAll.status === 401, 'DELETE /api/products without admin token returns 401 Unauthorized');

  const authDeleteAll = await testEndpoint('DELETE', '/api/products', null, { 'Authorization': `Bearer ${adminToken}` });
  assert(authDeleteAll.status === 200 && authDeleteAll.data.count === 0, 'DELETE /api/products with admin token deletes all products (200 OK)');

  const emptyProductsRes = await testEndpoint('GET', '/api/products');
  assert(emptyProductsRes.status === 200 && Array.isArray(emptyProductsRes.data) && emptyProductsRes.data.length === 0, 'GET /api/products returns empty array [] without auto-reseeding');

  // Test creating product without 3D model attachment (stlUrl is empty string)
  const createNoModelRes = await testEndpoint('POST', '/api/products', {
    name: 'Plain PLA Filament Spool',
    sku: 'FIL-PLA-001',
    category: 'Prototyping',
    price: 799,
    stock: 50,
    stlUrl: ''
  }, { 'Authorization': `Bearer ${adminToken}` });
  assert(createNoModelRes.status === 201 && createNoModelRes.data.product && createNoModelRes.data.product.stlUrl === '', 'POST /api/products allows creating product without 3D model attachment (stlUrl is empty)');

  console.log('\n--- 24. Order Payment Method & Status Updates ([Paid, Not Paid, COD, WhatsApp, Bank Account, UPI]) ---');
  // Create an order to test payment status updates
  const testOrderRes = await testEndpoint('POST', '/api/orders', {
    items: [{ productId: 'test_p1', name: 'Test Bracket', price: 299, quantity: 1 }],
    userName: 'Aarav Mehta',
    userEmail: 'aarav@test.com',
    userPhone: '9876543210',
    shippingAddress: '42 MG Road, Bangalore',
    paymentMethod: 'UPI'
  });
  assert(testOrderRes.status === 201, 'POST /api/orders creates test order for payment method verification');
  const testOrderId = testOrderRes.data.order.id;

  const paymentOptions = ['Paid', 'Not Paid', 'COD', 'WhatsApp', 'Bank Account', 'UPI'];
  for (const opt of paymentOptions) {
    const updateRes = await testEndpoint('PUT', `/api/orders/${testOrderId}/status`, {
      paymentStatus: opt === 'Paid' ? 'Paid' : (opt === 'Not Paid' ? 'Not Paid' : opt),
      paymentMethod: opt
    }, { 'Authorization': `Bearer ${adminToken}` });
    assert(updateRes.status === 200 && (updateRes.data.order.paymentMethod === opt || updateRes.data.order.paymentStatus === opt), `PUT /api/orders/:id/status successfully updates order payment to "${opt}"`);
  }

  // Restore database snapshot
  try {
    fs.writeFileSync(DB_FILE, dbBackup, 'utf-8');
  } catch (err) {
    console.error('Failed to restore dbBackup', err);
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
