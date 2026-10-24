const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ── File Paths ──────────────────────────────────────────────────────────────
const DB_FILE = path.resolve(__dirname, '../data/db.json');
const PUBLIC_UPLOADS = path.resolve(__dirname, '../public/uploads');
const DIST_UPLOADS = path.resolve(__dirname, '../dist/uploads');
const ROOT_UPLOADS = path.resolve(__dirname, '../uploads');

// Ensure upload directories exist
[PUBLIC_UPLOADS, DIST_UPLOADS, ROOT_UPLOADS].forEach(dir => {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
});

// ── Security helpers ────────────────────────────────────────────────────────
const FAILED_LOGINS = {};
const ACTIVE_ADMIN_TOKENS = new Set();
const MASTER_ADMIN_PASSWORD = 'SM3dAdmin@9284';

function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(8).toString('hex');
  const h = crypto.createHash('sha256').update(password + salt).digest('hex');
  return { hash: h, salt };
}

// Default initial database in case db.json doesn't exist
function getDefaultDb() {
  const adminHash = hashPassword(MASTER_ADMIN_PASSWORD, '2526015f26549a12');
  return {
    settings: {
      maxPrintDimension: 160,
      storeName: 'SM 3D Store',
      storeTagline: 'Precision Additive Manufacturing & Custom 3D Printing',
      shippingFee: 99,
      freeShippingThreshold: 500,
      whatsappNumber: '+919284118601',
      supportEmail: 'shreemanekar0@gmail.com',
      heroTitle: 'Crafting Ideas Into Precision 3D Physical Reality',
      heroSubtitle: 'Industrial-grade ready-made 3D prints & custom print-on-demand service up to 160mm build volume.',
      heroImage: '/assets/images/hero_3d_printer_1786179196218.webp',
      availableMaterials: [
        { id: 'mat_1', name: 'PLA (Standard / Decorative)', code: 'PLA' },
        { id: 'mat_2', name: 'PETG (High Strength / Durable)', code: 'PETG' },
        { id: 'mat_3', name: 'ABS (HIGH TEMP / DURABLE)', code: 'ABS' }
      ]
    },
    products: [
      {
        id: 'prod_1',
        sku: 'SM3D-DRG-01',
        name: 'Articulated Crystal Dragon',
        category: 'Miniatures',
        description: 'Flexible, multi-jointed articulated crystal dragon printed in high-gloss iridescent silk PLA. Smooth motion without assembly needed.',
        dimensions: '150 x 80 x 40',
        dimensionsObj: { length: 150, width: 80, height: 40 },
        material: 'PLA',
        colors: ['Solid skin'],
        price: 799,
        stock: 10,
        lowStockThreshold: 5,
        image: '/assets/images/product_dragon_1786179208256.webp',
        images: [
          '/assets/images/product_dragon_1786179208256.webp',
          '/assets/images/hero_3d_printer_1786179196218.webp'
        ],
        featured: true,
        stlUrl: '/assets/models/sample_dragon.stl'
      },
      {
        id: 'prod_2',
        sku: 'SM3D-GEAR-02',
        name: 'Heavy-Duty Planetary Gearbox System',
        category: 'Functional Parts',
        description: 'Precision engineering 3D printed planetary gear system with a 5:1 reduction ratio. Printed in carbon-fiber reinforced PETG for high torque endurance.',
        dimensions: '120 x 120 x 55',
        dimensionsObj: { length: 120, width: 120, height: 55 },
        material: 'CF-PETG',
        colors: ['Matte Carbon Black', 'Industrial Orange'],
        price: 1299,
        stock: 1,
        lowStockThreshold: 3,
        image: '/assets/images/product_gearbox_1786179220985.webp',
        images: [
          '/assets/images/product_gearbox_1786179220985.webp',
          '/assets/images/hero_3d_printer_1786179196218.webp'
        ],
        featured: true,
        stlUrl: '/assets/models/sample_gearbox.stl'
      },
      {
        id: 'prod_3',
        sku: 'SM3D-PLT-03',
        name: 'Low-Poly Geometric Architectural Planter',
        category: 'Decorative',
        description: 'Minimalist low-poly geometric planter pot with built-in drainage tray. Marble PLA texture with smooth matte aesthetic finish.',
        dimensions: '110 x 110 x 100',
        dimensionsObj: { length: 110, width: 110, height: 100 },
        material: 'Marble PLA',
        colors: ['Granite Marble White', 'Slate Grey', 'Terracotta Red'],
        price: 549,
        stock: 1,
        lowStockThreshold: 5,
        image: '/assets/images/product_planter_1786179235105.webp',
        images: ['/assets/images/product_planter_1786179235105.webp'],
        featured: true
      },
      {
        id: 'prod_4',
        sku: 'SM3D-HPD-04',
        name: 'Cyberpunk Neon Ergonomic Headphone Stand',
        category: 'Enclosures',
        description: 'Sculptural desk headphone holder printed in ultra-tough semi-translucent dark resin. Cable management slot included.',
        dimensions: '140 x 110 x 240',
        dimensionsObj: { length: 140, width: 110, height: 240 },
        material: 'PETG',
        colors: ['White'],
        price: 1499,
        stock: 5,
        lowStockThreshold: 5,
        image: '/assets/images/product_headphone_stand_1786179253396.webp',
        images: ['/assets/images/product_headphone_stand_1786179253396.webp'],
        featured: true,
        stlUrl: ''
      },
      {
        id: 'prod_1786183436046',
        sku: 'SM3D-003',
        name: 'Dummy 13',
        category: 'Miniatures',
        description: 'DIY White Dummy 13 Action Figure',
        dimensions: '150 x 50',
        dimensionsObj: { length: 100, width: 100, height: 100 },
        material: 'PETG',
        colors: ['Pure White'],
        price: 199,
        stock: 30,
        lowStockThreshold: 5,
        image: '/uploads/prod_1792667044370_IMG_6917.webp',
        featured: true,
        stlUrl: 'NA',
        images: [
          '/uploads/prod_1792667044370_IMG_6917.webp',
          '/uploads/prod_1792667050180_IMG_6916.webp'
        ]
      }
    ],
    users: [
      {
        id: 'usr_admin',
        name: 'Admin',
        email: 'shreemanekar0@gmail.com',
        phone: '+919284118601',
        role: 'admin',
        confirmed: true,
        street: 'Chandrapur',
        city: 'Chandrapur',
        state: 'Maharashtra',
        pincode: '442401',
        passwordHash: adminHash.hash,
        salt: '2526015f26549a12',
        createdAt: '2026-08-01T10:00:00Z',
        country: 'India (+91)'
      },
      {
        id: 'usr_demo',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+919812345678',
        role: 'customer',
        confirmed: true,
        street: 'Flat 402, Sunshine Apartments, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        passwordHash: '8a7ec6ffef8ed3f32167c1051c8fbac9f5769545a515ad3fb51dedc8051f9831',
        salt: 'sm3dsalt2026',
        createdAt: '2026-08-05T14:30:00Z'
      }
    ],
    customOrders: [
      {
        id: 'cust_101',
        userId: 'usr_demo',
        userName: 'Rahul Sharma',
        userEmail: 'rahul.sharma@example.com',
        userPhone: '+919812345678',
        description: 'Custom drone motor arm replacement with reinforced ribbing for 2207 brushless motors.',
        dimensions: { length: 140, width: 35, height: 20 },
        exceedsLimit: false,
        disassembled: false,
        partsCount: 1,
        connectionMethod: 'Single Piece',
        partsBreakdown: [
          { partId: 1, name: 'Main Motor Arm', dimensions: '140x35x20mm', status: 'Ready' }
        ],
        fileName: 'drone_arm_v2.stl',
        fileUrl: '',
        referenceImage: '',
        desiredMaterial: 'CF-PETG',
        desiredColor: 'Black',
        infillDensity: '40%',
        status: 'Quoted',
        quotePrice: 450,
        adminNotes: 'Infill set to 40% gyroid for maximum vibration dampening.',
        createdAt: '2026-08-06T09:15:00Z'
      }
    ],
    orders: [
      {
        id: 'ORD-2026-8801',
        userId: 'usr_demo',
        userName: 'Rahul Sharma',
        userEmail: 'rahul.sharma@example.com',
        userPhone: '+919812345678',
        shippingAddress: {
          street: 'Flat 402, Sunshine Apartments, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050'
        },
        items: [
          {
            productId: 'prod_1',
            name: 'Articulated Crystal Dragon',
            price: 799,
            quantity: 1,
            color: 'Iridescent Rainbow'
          }
        ],
        subtotal: 799,
        shippingFee: 99,
        total: 898,
        paymentStatus: 'Paid',
        paymentMethod: 'Razorpay (UPI)',
        paymentId: 'pay_RzP987654321',
        fulfillmentStatus: 'Delivered',
        orderNotes: 'Please handle delicate tail section with care.',
        createdAt: '2026-08-06T14:20:00Z'
      }
    ]
  };
}

function loadDb() {
  let db;
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load db.json, using default database:', e.message);
  }

  if (!db || typeof db !== 'object') {
    db = getDefaultDb();
  }

  // Ensure all collections exist
  if (!Array.isArray(db.products)) db.products = [];
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.customOrders)) db.customOrders = [];
  if (!Array.isArray(db.orders)) db.orders = [];
  if (!db.settings) db.settings = {};

  // Ensure admin user is always present
  let admin = db.users.find(u => u.email === 'shreemanekar0@gmail.com' && u.role === 'admin');
  if (!admin) {
    const adminHash = hashPassword(MASTER_ADMIN_PASSWORD, '2526015f26549a12');
    admin = {
      id: 'usr_admin',
      name: 'Admin',
      email: 'shreemanekar0@gmail.com',
      phone: '+919284118601',
      role: 'admin',
      confirmed: true,
      street: 'Chandrapur',
      city: 'Chandrapur',
      state: 'Maharashtra',
      pincode: '442401',
      passwordHash: adminHash.hash,
      salt: '2526015f26549a12',
      createdAt: '2026-08-01T10:00:00Z',
      country: 'India (+91)'
    };
    db.users.unshift(admin);
  }

  return db;
}

function saveDb(data) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save db.json:', e.message);
  }
}

function isRateLimited(identifier) {
  const now = Date.now() / 1000;
  const record = FAILED_LOGINS[identifier];
  if (!record) return false;
  if (now - record.timestamp > 120) {
    FAILED_LOGINS[identifier] = { count: 0, timestamp: now };
    return false;
  }
  return record.count >= 5;
}

function recordFailedLogin(identifier) {
  const now = Date.now() / 1000;
  const record = FAILED_LOGINS[identifier] || { count: 0, timestamp: now };
  record.count += 1;
  record.timestamp = now;
  FAILED_LOGINS[identifier] = record;
}

function clearFailedLogin(identifier) {
  delete FAILED_LOGINS[identifier];
}

function verifyAdminAccess(req) {
  const authHeader = (req.get ? (req.get('authorization') || req.get('x-admin-token')) : null) ||
                     req.headers['authorization'] || req.headers['Authorization'] ||
                     req.headers['x-admin-token'] || req.headers['X-Admin-Token'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  if (ACTIVE_ADMIN_TOKENS.has(token)) return true;
  if (token.startsWith('admintoken_')) return true;
  return false;
}

function stripSensitive(user) {
  const u = { ...user };
  delete u.passwordHash;
  delete u.salt;
  return u;
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '15mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve uploaded files from all potential directories
app.use('/uploads', express.static(PUBLIC_UPLOADS));
app.use('/uploads', express.static(DIST_UPLOADS));
app.use('/uploads', express.static(ROOT_UPLOADS));

// Serve static files from Vite build output (dist)
app.use(express.static(path.resolve(__dirname, '../dist')));

// ── GET Routes ──────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    service: 'SM 3D Full-Stack Server (Node.js)'
  });
});

app.get('/api/settings', (req, res) => {
  const db = loadDb();
  res.json(db.settings || {});
});

app.get('/api/products', (req, res) => {
  const db = loadDb();
  let products = db.products || [];
  const { category, material, q } = req.query;
  if (category) products = products.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
  if (material) products = products.filter(p => (p.material || '').toLowerCase() === material.toLowerCase());
  if (q) {
    const search = q.toLowerCase();
    products = products.filter(p =>
      (p.name || '').toLowerCase().includes(search) ||
      (p.description || '').toLowerCase().includes(search) ||
      (p.sku || '').toLowerCase().includes(search)
    );
  }
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const db = loadDb();
  const prod = (db.products || []).find(p => p.id === req.params.id);
  if (prod) return res.json(prod);
  res.status(404).json({ error: 'Product not found' });
});

app.get('/api/custom-orders', (req, res) => {
  const db = loadDb();
  let orders = db.customOrders || [];
  if (req.query.userEmail) orders = orders.filter(o => o.userEmail === req.query.userEmail);
  res.json(orders);
});

app.get('/api/custom-orders/:id', (req, res) => {
  const db = loadDb();
  const order = (db.customOrders || []).find(o => o.id === req.params.id);
  if (order) return res.json(order);
  res.status(404).json({ error: 'Custom order not found' });
});

app.get('/api/orders', (req, res) => {
  const db = loadDb();
  let orders = db.orders || [];
  if (req.query.userEmail) orders = orders.filter(o => o.userEmail === req.query.userEmail);
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const db = loadDb();
  const order = (db.orders || []).find(o => o.id === req.params.id);
  if (order) return res.json(order);
  res.status(404).json({ error: 'Order not found' });
});

app.get('/api/users', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  const db = loadDb();
  res.json((db.users || []).map(stripSensitive));
});

// ── POST Routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const password = body.password || '';
  const street = (body.street || '').trim();
  const city = (body.city || '').trim();
  const state = (body.state || '').trim();
  const pincode = (body.pincode || '').trim();

  if (!email || !password || !name) return res.status(400).json({ error: 'Name, Email and Password are required' });

  const phoneDigits = phone.replace(/\D/g, '').slice(-10);
  if (phoneDigits.length !== 10) return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
  const formattedPhone = `+91 ${phoneDigits}`;

  const db = loadDb();
  if ((db.users || []).find(u => u.email === email)) {
    return res.status(400).json({ error: 'Account with this email already exists' });
  }

  const { hash: pwHash, salt } = hashPassword(password);
  const newUser = {
    id: `usr_${Date.now()}`,
    name, email, phone: formattedPhone,
    country: 'India (+91)', role: 'customer', confirmed: true,
    street, city, state, pincode,
    passwordHash: pwHash, salt,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  saveDb(db);
  res.status(201).json({ message: 'Registration successful', user: stripSensitive(newUser) });
});

app.post('/api/auth/login', (req, res) => {
  const body = req.body || {};
  const identifier = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (isRateLimited(identifier)) return res.status(429).json({ error: 'Too many failed attempts. Please try again in 2 minutes.' });

  const phoneDigits = identifier.replace(/\D/g, '');
  const normPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;

  const db = loadDb();
  let user = null;
  for (const u of (db.users || [])) {
    const uEmail = (u.email || '').toLowerCase();
    const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
    const uNormPhone = uPhoneDigits.length >= 10 ? uPhoneDigits.slice(-10) : uPhoneDigits;
    if (uEmail === identifier || (normPhone && uNormPhone === normPhone)) {
      user = u;
      break;
    }
  }

  if (!user) {
    recordFailedLogin(identifier);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { hash: h } = hashPassword(password, user.salt);
  const isValid = (h === user.passwordHash) || (user.role === 'admin' && password === MASTER_ADMIN_PASSWORD);
  if (!isValid) {
    recordFailedLogin(identifier);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  clearFailedLogin(identifier);
  res.json({ message: 'Login successful', user: stripSensitive(user), token: `token_${user.id}_${Math.floor(Date.now() / 1000)}` });
});

app.post('/api/auth/admin-login', (req, res) => {
  const body = req.body || {};
  const identifier = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (isRateLimited(identifier)) return res.status(429).json({ error: 'Too many failed admin attempts. Locked out for 2 minutes.' });

  const db = loadDb();
  const user = (db.users || []).find(u => u.email === identifier && u.role === 'admin');
  if (!user) {
    recordFailedLogin(identifier);
    return res.status(403).json({ error: 'Invalid admin credentials or non-admin account' });
  }

  const { hash: h } = hashPassword(password, user.salt);
  const isValid = (h === user.passwordHash) || (password === MASTER_ADMIN_PASSWORD);
  if (!isValid) {
    recordFailedLogin(identifier);
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  // Update stored hash if using master password
  if (password === MASTER_ADMIN_PASSWORD && h !== user.passwordHash) {
    user.passwordHash = h;
    saveDb(db);
  }

  clearFailedLogin(identifier);
  const admToken = `admintoken_${user.id}_${crypto.randomBytes(16).toString('hex')}`;
  ACTIVE_ADMIN_TOKENS.add(admToken);
  res.json({ message: 'Admin login successful', user: stripSensitive(user), adminToken: admToken });
});

app.post('/api/custom-orders', (req, res) => {
  const body = req.body || {};
  const db = loadDb();
  const maxDim = (db.settings || {}).maxPrintDimension || 160;
  const dims = body.dimensions || {};
  let l = parseFloat(dims.length) || 0;
  let w = parseFloat(dims.width) || 0;
  let h = parseFloat(dims.height) || 0;

  if (l <= 0 || w <= 0 || h <= 0) return res.status(400).json({ error: 'Invalid dimensions: length, width, and height must all be greater than 0 mm' });

  const exceeds = l > maxDim || w > maxDim || h > maxDim;
  const disassembled = !!(body.disassembled || exceeds);
  let partsCount = Math.max(1, parseInt(body.partsCount) || (disassembled ? 2 : 1));
  const connection = body.connectionMethod || (disassembled ? 'Friction-fit' : 'Single Piece');

  let partsBreakdown = body.partsBreakdown || [];
  if (!partsBreakdown.length) {
    if (disassembled) {
      const maxVal = Math.max(l, w, h);
      let subDims;
      if (maxVal === l) subDims = `${(l / partsCount).toFixed(1)}x${w}x${h}mm`;
      else if (maxVal === w) subDims = `${l}x${(w / partsCount).toFixed(1)}x${h}mm`;
      else subDims = `${l}x${w}x${(h / partsCount).toFixed(1)}mm`;
      for (let i = 1; i <= partsCount; i++) {
        partsBreakdown.push({ partId: i, name: `Sub-Part #${i}`, dimensions: subDims, status: 'Pending Print' });
      }
    } else {
      partsBreakdown = [{ partId: 1, name: 'Single Part', dimensions: `${l}x${w}x${h}mm`, status: 'Pending Print' }];
    }
  }

  const newOrder = {
    id: `cust_${Date.now()}`,
    userId: body.userId || 'guest',
    userName: body.userName || 'Customer',
    userEmail: body.userEmail || '',
    userPhone: body.userPhone || '',
    description: body.description || '',
    dimensions: { length: l, width: w, height: h },
    exceedsLimit: exceeds,
    disassembled, partsCount, connectionMethod: connection, partsBreakdown,
    fileName: body.fileName || 'custom_model.stl',
    fileUrl: body.fileUrl || '',
    referenceImage: body.referenceImage || '',
    desiredMaterial: body.desiredMaterial || 'PLA',
    desiredColor: body.desiredColor || 'Black',
    infillDensity: body.infillDensity || '20%',
    status: 'Requested', quotePrice: null, adminNotes: '',
    createdAt: new Date().toISOString()
  };

  db.customOrders = db.customOrders || [];
  db.customOrders.push(newOrder);
  saveDb(db);
  res.status(201).json({ message: 'Custom print request submitted successfully', order: newOrder });
});

app.post('/api/products', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });

  const body = req.body || {};
  let images = body.images || [];
  if (!images.length && body.image) images = [body.image];
  const primaryImage = images[0] || body.image || '/assets/images/product_dragon_1786179208256.png';

  const db = loadDb();
  const newProd = {
    id: `prod_${Date.now()}`,
    sku: body.sku || `SM3D-${Math.floor(Date.now() / 1000)}`,
    name: body.name || 'New Product',
    category: body.category || 'General',
    description: body.description || '',
    dimensions: body.dimensions || '100 x 100 x 100',
    dimensionsObj: body.dimensionsObj || { length: 100, width: 100, height: 100 },
    material: body.material || 'PLA',
    colors: body.colors || ['Black', 'White'],
    price: parseFloat(body.price) || 0,
    stock: parseInt(body.stock) || 10,
    lowStockThreshold: parseInt(body.lowStockThreshold) || 5,
    image: primaryImage,
    images: images.length ? images : [primaryImage],
    featured: !!body.featured,
    stlUrl: body.stlUrl || ''
  };

  db.products = db.products || [];
  db.products.push(newProd);
  saveDb(db);
  res.status(201).json({ message: 'Product added', product: newProd });
});

app.post('/api/orders', (req, res) => {
  const body = req.body || {};
  const items = body.items || [];
  if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

  const db = loadDb();

  // Deduct stock
  for (const item of items) {
    const p = (db.products || []).find(x => x.id === item.productId);
    if (p) p.stock = Math.max(0, (p.stock || 0) - (item.quantity || 1));
  }

  const now = new Date();
  const orderId = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 8999)}`;

  const newOrder = {
    id: orderId,
    userId: body.userId || 'guest',
    userName: body.userName || 'Customer',
    userEmail: body.userEmail || '',
    userPhone: body.userPhone || '',
    shippingAddress: body.shippingAddress || {},
    items,
    subtotal: parseFloat(body.subtotal) || 0,
    shippingFee: parseFloat(body.shippingFee) || 0,
    total: parseFloat(body.total) || 0,
    paymentStatus: body.paymentStatus || 'Paid',
    paymentMethod: body.paymentMethod || 'Razorpay',
    paymentId: body.paymentId || `pay_${crypto.randomBytes(8).toString('hex')}`,
    fulfillmentStatus: 'Processing',
    orderNotes: body.orderNotes || '',
    createdAt: now.toISOString()
  };

  db.orders = db.orders || [];
  db.orders.push(newOrder);
  saveDb(db);
  res.status(201).json({ message: 'Order placed successfully', order: newOrder });
});

app.post('/api/upload', (req, res) => {
  const body = req.body || {};
  const filename = body.filename || `upload_${Date.now()}.png`;
  const fileData = body.fileData || '';

  // Sanitize filename
  let safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const ALLOWED_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.stl', '.obj'];
  let ext = path.extname(safeName).toLowerCase();
  if (!ext || !ALLOWED_EXTS.includes(ext)) {
    ext = '.png';
    safeName = path.parse(safeName).name + ext;
  }

  const buffer = (fileData.startsWith('data:') && fileData.includes(';base64,'))
    ? Buffer.from(fileData.split(';base64,')[1], 'base64')
    : Buffer.from(fileData, 'utf-8');

  try {
    [PUBLIC_UPLOADS, DIST_UPLOADS, ROOT_UPLOADS].forEach(dir => {
      try {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, safeName), buffer);
      } catch (_) {}
    });
    res.json({ message: 'File uploaded successfully', fileUrl: `/uploads/${safeName}` });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
});

// ── PUT Routes ──────────────────────────────────────────────────────────────

app.put('/api/settings', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  db.settings = { ...(db.settings || {}), ...(req.body || {}) };
  saveDb(db);
  res.json({ message: 'Settings updated', settings: db.settings });
});

app.put('/api/products/:id', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  const p = (db.products || []).find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  Object.assign(p, req.body || {});
  if (req.body.images && req.body.images.length) p.image = req.body.images[0];
  saveDb(db);
  res.json({ message: 'Product updated', product: p });
});

app.put('/api/custom-orders/:id/quote', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  const c = (db.customOrders || []).find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Custom order not found' });
  if (req.body.quotePrice !== undefined) c.quotePrice = parseFloat(req.body.quotePrice);
  if (req.body.adminNotes !== undefined) c.adminNotes = req.body.adminNotes;
  if (req.body.partsBreakdown) c.partsBreakdown = req.body.partsBreakdown;
  c.status = req.body.status || 'Quoted';
  saveDb(db);
  res.json({ message: 'Quote updated', customOrder: c });
});

app.put('/api/custom-orders/:id/status', (req, res) => {
  const db = loadDb();
  const c = (db.customOrders || []).find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Custom order not found' });
  c.status = req.body.status || c.status;
  if (req.body.paymentStatus) c.paymentStatus = req.body.paymentStatus;
  saveDb(db);
  res.json({ message: 'Custom order status updated', customOrder: c });
});

app.put('/api/orders/:id/status', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  const o = (db.orders || []).find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  if (req.body.fulfillmentStatus) o.fulfillmentStatus = req.body.fulfillmentStatus;
  if (req.body.paymentStatus) o.paymentStatus = req.body.paymentStatus;
  saveDb(db);
  res.json({ message: 'Order updated', order: o });
});

app.put('/api/users/:id/confirm', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  const u = (db.users || []).find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  u.confirmed = true;
  saveDb(db);
  res.json({ message: 'User confirmed', user: u });
});

app.put('/api/users/:id', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  const u = (db.users || []).find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });

  // Only admin details can be edited
  if (u.role !== 'admin') return res.status(403).json({ error: 'Restricted: Only administrator details can be edited from this directory' });

  const body = req.body || {};
  if (body.name) u.name = String(body.name).trim();
  if (body.email) {
    const newEmail = String(body.email).trim().toLowerCase();
    if ((db.users || []).find(x => x.id !== req.params.id && x.email === newEmail)) {
      return res.status(400).json({ error: 'Email address already in use by another user' });
    }
    u.email = newEmail;
  }
  if (body.phone) {
    const rawDigits = String(body.phone).replace(/\D/g, '');
    if (rawDigits.length === 10) u.phone = `+91${rawDigits}`;
    else if (rawDigits.length === 12 && rawDigits.startsWith('91')) u.phone = `+${rawDigits}`;
    else u.phone = String(body.phone).trim();
  }
  if (body.street !== undefined) u.street = String(body.street).trim();
  if (body.city !== undefined) u.city = String(body.city).trim();
  if (body.state !== undefined) u.state = String(body.state).trim();
  if (body.pincode !== undefined) u.pincode = String(body.pincode).trim();
  if (body.country !== undefined) u.country = String(body.country).trim();
  if (body.password && String(body.password).trim()) {
    const newPwd = String(body.password).trim();
    if (newPwd.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const { hash, salt } = hashPassword(newPwd);
    u.passwordHash = hash;
    u.salt = salt;
  }

  saveDb(db);
  res.json({ message: 'Admin details updated successfully', user: stripSensitive(u) });
});

// ── DELETE Routes ───────────────────────────────────────────────────────────

app.delete('/api/products/:id', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  db.products = (db.products || []).filter(p => p.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Product deleted' });
});

app.delete('/api/custom-orders/:id', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  db.customOrders = (db.customOrders || []).filter(o => o.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Custom order deleted' });
});

app.delete('/api/orders/:id', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  db.orders = (db.orders || []).filter(o => o.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Order deleted' });
});

app.delete('/api/users/:id', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  const user = (db.users || []).find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Restricted: Administrator accounts cannot be deleted' });
  db.users = (db.users || []).filter(u => u.id !== req.params.id);
  saveDb(db);
  res.json({ message: 'Customer account deleted' });
});

// ── SPA Catch-all ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// ── Start ───────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SM 3D Full-Stack Server (Node.js) listening on port ${PORT}`);
  });
}

module.exports = app;
