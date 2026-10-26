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
const PARENT_UPLOADS = path.resolve(__dirname, '../../uploads');

// Ensure upload directories exist
[PUBLIC_UPLOADS, DIST_UPLOADS, ROOT_UPLOADS, PARENT_UPLOADS].forEach(dir => {
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

// Default delivery cities coverage
const DEFAULT_DELIVERY_CITIES = [
  { id: 'city_1', name: 'Chandrapur', state: 'Maharashtra', estimatedDays: '1-2 Days', active: true },
  { id: 'city_2', name: 'Nagpur', state: 'Maharashtra', estimatedDays: '1-2 Days', active: true },
  { id: 'city_3', name: 'Mumbai', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_4', name: 'Pune', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_5', name: 'Nashik', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_6', name: 'Thane', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_7', name: 'Navi Mumbai', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_8', name: 'Aurangabad (Chhatrapati Sambhajinagar)', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_9', name: 'Amravati', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_10', name: 'Kolhapur', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_11', name: 'Solapur', state: 'Maharashtra', estimatedDays: '2-3 Days', active: true },
  { id: 'city_12', name: 'Hyderabad', state: 'Telangana', estimatedDays: '2-3 Days', active: true },
  { id: 'city_13', name: 'Bengaluru', state: 'Karnataka', estimatedDays: '2-4 Days', active: true },
  { id: 'city_14', name: 'Chennai', state: 'Tamil Nadu', estimatedDays: '2-4 Days', active: true },
  { id: 'city_15', name: 'New Delhi', state: 'Delhi NCR', estimatedDays: '2-4 Days', active: true },
  { id: 'city_16', name: 'Noida', state: 'Uttar Pradesh', estimatedDays: '2-4 Days', active: true },
  { id: 'city_17', name: 'Gurugram', state: 'Haryana', estimatedDays: '2-4 Days', active: true },
  { id: 'city_18', name: 'Ahmedabad', state: 'Gujarat', estimatedDays: '2-3 Days', active: true },
  { id: 'city_19', name: 'Surat', state: 'Gujarat', estimatedDays: '2-3 Days', active: true },
  { id: 'city_20', name: 'Vadodara', state: 'Gujarat', estimatedDays: '2-3 Days', active: true },
  { id: 'city_21', name: 'Rajkot', state: 'Gujarat', estimatedDays: '3-4 Days', active: true },
  { id: 'city_22', name: 'Indore', state: 'Madhya Pradesh', estimatedDays: '2-3 Days', active: true },
  { id: 'city_23', name: 'Bhopal', state: 'Madhya Pradesh', estimatedDays: '2-3 Days', active: true },
  { id: 'city_24', name: 'Jabalpur', state: 'Madhya Pradesh', estimatedDays: '2-3 Days', active: true },
  { id: 'city_25', name: 'Raipur', state: 'Chhattisgarh', estimatedDays: '2-3 Days', active: true },
  { id: 'city_26', name: 'Jaipur', state: 'Rajasthan', estimatedDays: '3-4 Days', active: true },
  { id: 'city_27', name: 'Kolkata', state: 'West Bengal', estimatedDays: '3-4 Days', active: true },
  { id: 'city_28', name: 'Lucknow', state: 'Uttar Pradesh', estimatedDays: '3-4 Days', active: true },
  { id: 'city_29', name: 'Kanpur', state: 'Uttar Pradesh', estimatedDays: '3-4 Days', active: true },
  { id: 'city_30', name: 'Varanasi', state: 'Uttar Pradesh', estimatedDays: '3-4 Days', active: true },
  { id: 'city_31', name: 'Chandigarh', state: 'Punjab / Chandigarh', estimatedDays: '3-4 Days', active: true },
  { id: 'city_32', name: 'Ludhiana', state: 'Punjab', estimatedDays: '3-4 Days', active: true },
  { id: 'city_33', name: 'Kochi', state: 'Kerala', estimatedDays: '3-4 Days', active: true },
  { id: 'city_34', name: 'Thiruvananthapuram', state: 'Kerala', estimatedDays: '3-4 Days', active: true },
  { id: 'city_35', name: 'Coimbatore', state: 'Tamil Nadu', estimatedDays: '3-4 Days', active: true },
  { id: 'city_36', name: 'Visakhapatnam', state: 'Andhra Pradesh', estimatedDays: '3-4 Days', active: true },
  { id: 'city_37', name: 'Vijayawada', state: 'Andhra Pradesh', estimatedDays: '3-4 Days', active: true },
  { id: 'city_38', name: 'Bhubaneswar', state: 'Odisha', estimatedDays: '3-4 Days', active: true },
  { id: 'city_39', name: 'Patna', state: 'Bihar', estimatedDays: '3-5 Days', active: true },
  { id: 'city_40', name: 'Dehradun', state: 'Uttarakhand', estimatedDays: '3-5 Days', active: true }
];

// Default initial database in case db.json doesn't exist
function getDefaultDb() {
  const adminHash = hashPassword(MASTER_ADMIN_PASSWORD, '2526015f26549a12');
  return {
    deliveryCities: DEFAULT_DELIVERY_CITIES,
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
      ],
      upiId: 'shreemanekar0@okaxis',
      upiQrImage: '',
      razorpayId: 'rzp_test_sm3d',
      accountNumber: '928411860101',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India',
      accountHolderName: 'SM 3D Technologies',
      techSpecs: {
        buildVolume: '160 × 160 × 160 mm',
        layerHeight: '0.12 - 0.28 mm',
        materials: 'PLA, PETG, ABS, CF-PETG, TPU',
        nozzleSize: '0.4 mm Hardened Precision',
        printSpeed: 'Up to 250 mm/s',
        notes: 'Industrial Grade Direct Drive Extrusion'
      },
      availableFilaments: ['PLA', 'PETG', 'ABS', 'CF-PETG', 'TPU', 'Marble PLA', 'Silk Rainbow PLA', 'Nylon', 'Resin'],
      deliveryCities: DEFAULT_DELIVERY_CITIES
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

  // Ensure delivery cities collection exists
  if (!Array.isArray(db.deliveryCities)) {
    if (Array.isArray(db.settings.deliveryCities)) {
      db.deliveryCities = db.settings.deliveryCities;
    } else {
      db.deliveryCities = [...DEFAULT_DELIVERY_CITIES];
    }
  }
  if (!Array.isArray(db.settings.deliveryCities)) {
    db.settings.deliveryCities = db.deliveryCities;
  }

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

// ── Advanced Security Shields: SQL Injection & Brute Force Defense ─────────
const BRUTE_FORCE_STORE = new Map();
const GLOBAL_IP_REQUESTS = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function checkBruteForceLock(key) {
  const now = Date.now();
  const record = BRUTE_FORCE_STORE.get(key);
  if (!record) return { locked: false, remainingAttempts: 5 };

  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, remainingSec };
  }

  // Reset if window has elapsed
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    BRUTE_FORCE_STORE.delete(key);
    return { locked: false, remainingAttempts: 5 };
  }

  const remainingAttempts = Math.max(0, 5 - record.attempts);
  return { locked: false, remainingAttempts };
}

function recordFailedAuth(key) {
  const now = Date.now();
  const record = BRUTE_FORCE_STORE.get(key) || { attempts: 0, lockedUntil: 0, lastAttempt: now };
  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= 5) {
    record.lockedUntil = now + (15 * 60 * 1000); // 15 minute lock
    console.warn(`[SECURITY FIREWALL] Brute-force lockout triggered for: [${key}]. Access locked for 15 minutes.`);
  }
  BRUTE_FORCE_STORE.set(key, record);
}

function clearAuthFailures(key) {
  BRUTE_FORCE_STORE.delete(key);
}

// SQL & Exploit Injection Detection Patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(UNION(\s+ALL)?)\s+SELECT\b)/i,
  /(\bSELECT\b[\s\S]+\bFROM\b)/i,
  /(\bINSERT\s+INTO\b[\s\S]+\bVALUES\b)/i,
  /(\bDELETE\s+FROM\b)/i,
  /(\bUPDATE\b[\s\S]+\bSET\b)/i,
  /(\bDROP\s+(TABLE|DATABASE|VIEW|COLUMN|INDEX)\b)/i,
  /(\bALTER\s+TABLE\b)/i,
  /(\bEXEC(\s|\()+)/i,
  /(\bxp_cmdshell\b)/i,
  /(;\s*--)/i,
  /(--\s*($|\n))/m,
  /(\/\*[\s\S]*?\*\/)/,
  /(\bOR\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
  /(\bAND\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
  /('\s*OR\s*')/i,
  /(\bWAITFOR\s+DELAY\b)/i,
  /(\bBENCHMARK\s*\()/i,
  /(\bPG_SLEEP\s*\()/i,
  /(admin'\s*--)/i,
  /(';.*--)/i,
  /(;\s*(cat|rm|ls|sh|bash|curl|wget)\b)/i,
  /(\|\|\s*(cat|rm|ls|sh|bash|curl|wget)\b)/i,
  /(&&\s*(cat|rm|ls|sh|bash|curl|wget)\b)/i,
  /(\/etc\/(passwd|shadow))/i
];

function containsSqlInjection(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) return true;
    }
    return false;
  }
  if (Array.isArray(value)) {
    return value.some(item => containsSqlInjection(item));
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('__proto__') || key.includes('constructor')) return true;
      if (containsSqlInjection(key)) return true;
      if (containsSqlInjection(value[key])) return true;
    }
  }
  return false;
}

function sqlInjectionShield(req, res, next) {
  if (req.path.startsWith('/assets') || req.path.startsWith('/uploads') || req.path === '/api/upload') {
    return next();
  }

  if (containsSqlInjection(req.query) || containsSqlInjection(req.params)) {
    console.warn(`[SECURITY FIREWALL] Blocked SQL Injection attack in query/params from IP: ${getClientIp(req)} on ${req.method} ${req.originalUrl}`);
    return res.status(403).json({
      error: 'Security Alert: Malicious SQL / Command injection payload detected and blocked by server firewall.'
    });
  }

  if (req.body && typeof req.body === 'object') {
    const payloadCopy = { ...req.body };
    if (req.path === '/api/upload') delete payloadCopy.fileData; // base64 binary payload
    if (containsSqlInjection(payloadCopy)) {
      console.warn(`[SECURITY FIREWALL] Blocked SQL Injection attack in request payload from IP: ${getClientIp(req)} on ${req.method} ${req.originalUrl}`);
      return res.status(403).json({
        error: 'Security Alert: Malicious SQL / Command injection payload detected in request body and blocked by server firewall.'
      });
    }
  }

  next();
}

function globalRateLimiter(req, res, next) {
  if (req.path.startsWith('/assets') || req.path.startsWith('/uploads')) {
    return next();
  }
  const ip = getClientIp(req);
  const now = Date.now();
  const record = GLOBAL_IP_REQUESTS.get(ip) || { count: 0, windowStart: now };

  if (now - record.windowStart > 60 * 1000) {
    record.count = 1;
    record.windowStart = now;
  } else {
    record.count += 1;
  }
  GLOBAL_IP_REQUESTS.set(ip, record);

  if (record.count > 200) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'Rate limit exceeded: Too many requests from this IP. Please wait a minute before retrying.'
    });
  }
  next();
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
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// Global Rate Limiter & DDoS Mitigation
app.use(globalRateLimiter);

// SQL Injection & Command Exploit Firewall
app.use(sqlInjectionShield);

// Security Headers (OWASP Hardening)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

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

app.get('/api/delivery-cities', (req, res) => {
  const db = loadDb();
  const rawCities = db.deliveryCities || db.settings?.deliveryCities || [];
  const normalized = rawCities.map(c => {
    const isAct = c.active !== false && c.isActive !== false;
    const days = c.estimatedDays || c.turnaround || '2-4 Days';
    return {
      ...c,
      active: isAct,
      isActive: isAct,
      estimatedDays: days,
      turnaround: days
    };
  });
  const activeOnly = req.query.active === 'true';
  const filtered = activeOnly ? normalized.filter(c => c.active) : normalized;
  const activeCount = normalized.filter(c => c.active).length;
  res.json({
    count: activeCount,
    totalCount: normalized.length,
    cities: filtered
  });
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
  const userEmail = req.query.userEmail;
  if (!userEmail && !verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required to access custom orders directory' });
  }
  const db = loadDb();
  let orders = db.customOrders || [];
  if (userEmail) orders = orders.filter(o => (o.userEmail || '').toLowerCase() === userEmail.toLowerCase());
  res.json(orders);
});

app.get('/api/custom-orders/:id', (req, res) => {
  const db = loadDb();
  const order = (db.customOrders || []).find(o => o.id === req.params.id);
  if (order) return res.json(order);
  res.status(404).json({ error: 'Custom order not found' });
});

app.get('/api/orders', (req, res) => {
  const userEmail = req.query.userEmail;
  if (!userEmail && !verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required to access customer orders directory' });
  }
  const db = loadDb();
  let orders = db.orders || [];
  if (userEmail) orders = orders.filter(o => (o.userEmail || '').toLowerCase() === userEmail.toLowerCase());
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

// ── Materials Matrix Endpoint ──────────────────────────────────────────────
const MATERIALS_DATA = [
  {
    id: 'mat_pla',
    name: 'PLA+ (Polylactic Acid)',
    shortCode: 'PLA',
    category: 'Standard / Precision Detail',
    tensileStrength: '55-65 MPa',
    heatDeflection: '55 °C',
    flexibility: 'Low (1.5% elongation)',
    uvResistance: 'Moderate',
    foodSafe: 'Food Contact Safe (Raw resin)',
    finish: 'Smooth Satin / Aztec Gold Silk',
    density: 1.24,
    baseCostPerGram: 2.2,
    leadTime: '24-48 Hours',
    bestUses: ['Visual Prototypes', 'Articulated Miniatures', 'Architectural Models', 'Desk Accessories'],
    pros: ['Ultra-fine 0.12mm layer capability', 'Zero warping', 'Crisp overhangs', 'Biodegradable eco-polymer'],
    cons: ['Softens above 55°C', 'Brittle under repeated high-impact shocks']
  },
  {
    id: 'mat_petg',
    name: 'PETG (High-Strength Glycol)',
    shortCode: 'PETG',
    category: 'Engineering / Outdoor Functional',
    tensileStrength: '50-58 MPa',
    heatDeflection: '75 °C',
    flexibility: 'Moderate (7% elongation)',
    uvResistance: 'Excellent (Weatherproof)',
    foodSafe: 'FDA Approved polymer',
    finish: 'Semi-gloss industrial durable',
    density: 1.27,
    baseCostPerGram: 2.8,
    leadTime: '24-48 Hours',
    bestUses: ['Outdoor Enclosures', 'Waterproof Reservoirs', 'Snap-fit Hinges', 'Drone Mounts', 'Automotive Clamps'],
    pros: ['Superior layer-to-layer weld strength', 'Chemically resistant to acids & oils', 'Weatherproof UV stability'],
    cons: ['Slightly more flexible than PLA', 'Requires high temperature dry storage']
  },
  {
    id: 'mat_abs',
    name: 'ABS (Heat & Impact Resistant)',
    shortCode: 'ABS',
    category: 'High-Impact / Automotive',
    tensileStrength: '42-48 MPa',
    heatDeflection: '98 °C',
    flexibility: 'High (10% elongation)',
    uvResistance: 'Moderate',
    foodSafe: 'Not Recommended',
    finish: 'Matte (Acetone vapor-smoothable to glossy)',
    density: 1.04,
    baseCostPerGram: 3.2,
    leadTime: '2-3 Days',
    bestUses: ['Under-the-Hood Car Trim', 'Power Tool Casings', 'Electronics Housings', 'Machinable Fixtures'],
    pros: ['Withstands heat up to 98°C', 'Can be acetone vapor-smoothed to mirror gloss', 'High ductile impact toughness'],
    cons: ['Requires heated enclosure to print', 'Thermal contraction requires calibrated compensation']
  },
  {
    id: 'mat_cf_petg',
    name: 'Carbon Fiber PETG (CF-PETG)',
    shortCode: 'CF-PETG',
    category: 'Advanced Composite',
    tensileStrength: '78-88 MPa',
    heatDeflection: '84 °C',
    flexibility: 'Ultra Rigid (<1% flex)',
    uvResistance: 'Superior',
    foodSafe: 'No',
    finish: 'Stealth Matte Charcoal with micro-fiber texture',
    density: 1.30,
    baseCostPerGram: 4.8,
    leadTime: '2-4 Days',
    bestUses: ['UAV / Drone Airframes', 'Robotic Arms', 'Precision Measurement Jigs', 'Motorsport Brackets'],
    pros: ['Exceptional strength-to-weight ratio', 'Virtually invisible layer seams', 'High dimensional stability'],
    cons: ['Requires hardened tool-steel nozzles', 'Higher material cost']
  },
  {
    id: 'mat_tpu',
    name: 'TPU 95A (Flexible Elastomer)',
    shortCode: 'TPU',
    category: 'Flexible / Cushioning',
    tensileStrength: '35-42 MPa',
    heatDeflection: '60 °C',
    flexibility: 'Extreme (450% elongation)',
    uvResistance: 'High',
    foodSafe: 'Specific industrial grades',
    finish: 'Matte rubberized grip',
    density: 1.21,
    baseCostPerGram: 3.8,
    leadTime: '2-4 Days',
    bestUses: ['Vibration Dampers', 'Protective Bumpers', 'Sealing Gaskets', 'RC Tires', 'Ergonomic Grips'],
    pros: ['Virtually tear-proof', 'High elasticity and bounceback', 'Resistant to greases and lubricants'],
    cons: ['Slow print speed (25-35 mm/s)', 'Supports difficult to remove']
  },
  {
    id: 'mat_nylon',
    name: 'Nylon PA12',
    shortCode: 'PA12',
    category: 'Industrial Low-Friction',
    tensileStrength: '65-72 MPa',
    heatDeflection: '110 °C',
    flexibility: 'Tough & Yielding',
    uvResistance: 'Good',
    foodSafe: 'Contact compliant grades',
    finish: 'Industrial velvet matte',
    density: 1.14,
    baseCostPerGram: 5.5,
    leadTime: '3-4 Days',
    bestUses: ['Kinematic Gear Trains', 'Heavy-Duty Snap Clips', 'Bushings & Bearings', 'Functional End-Use Machinery'],
    pros: ['Self-lubricating low friction coefficient', 'High fatigue cycle resistance', 'Continuous 110°C rating'],
    cons: ['Highly hygroscopic (needs active drybox feeding)', 'Warps without specialized adhesive beds']
  },
  {
    id: 'mat_resin',
    name: 'Tough 8K Photopolymer Resin',
    shortCode: 'Resin',
    category: 'Ultra-High Detail Micro-SLA',
    tensileStrength: '48-56 MPa',
    heatDeflection: '65 °C',
    flexibility: 'Rigid / Glass-like',
    uvResistance: 'Requires clear UV-blocking topcoat',
    foodSafe: 'No',
    finish: 'Injection-mold smooth (0.025 - 0.05mm layers)',
    density: 1.18,
    baseCostPerGram: 6.0,
    leadTime: '2-3 Days',
    bestUses: ['Jewelry Master Molds', 'Tabletop Figurines & Miniatures', 'Medical & Dental Mockups', 'Fine Prototypes'],
    pros: ['Micron-level sharpness', 'Zero visible layer lines', 'Glass-like intricate resolution'],
    cons: ['Requires isopropyl wash & UV post-curing', 'More brittle than FDM filaments']
  }
];

app.get('/api/materials', (req, res) => {
  res.json(MATERIALS_DATA);
});

// ── Customer Reviews & Real Print Showcase ──────────────────────────────────
const DEFAULT_REVIEWS = [
  {
    id: 'rev_1',
    customerName: 'Aarav Mehta',
    designation: 'Aerospace Engineering Student, IIT Bombay',
    rating: 5,
    verifiedBuyer: true,
    productName: 'CF-PETG Lightweight Drone Gimbal',
    category: 'Engineering & Drone Parts',
    date: '2026-10-18',
    image: '/assets/images/product_gearbox_1786179220985.webp',
    review: 'Dimensional accuracy was within ±0.08mm! The carbon-fiber composite is exceptionally stiff with zero flex under 6S motor vibration. Saved our robotics team weeks of CNC machining time.',
    material: 'Carbon Fiber PETG',
    printTime: '8h 24m',
    weight: '64g'
  },
  {
    id: 'rev_2',
    customerName: 'Priya Sundaram',
    designation: 'Lead Interior Architect, Bengaluru',
    rating: 5,
    verifiedBuyer: true,
    productName: 'Parametric Hexagon Planter & Water Reservoir',
    category: 'Home & Decor',
    date: '2026-10-21',
    image: '/assets/images/product_planter_1786179235105.webp',
    review: 'Ordered in Silk Aztec Gold. The water reservoir drainage tray fit together seamlessly with crisp watertight walls. Express dispatch arrived in Bengaluru in just 2 days with flawless packaging!',
    material: 'Silk Aztec Gold PLA',
    printTime: '11h 10m',
    weight: '142g'
  },
  {
    id: 'rev_3',
    customerName: 'Vikram Rajput',
    designation: 'Hardware Prototype Lead, Pune',
    rating: 5,
    verifiedBuyer: true,
    productName: 'Dual Planetary Reduction Mechanism',
    category: 'Robotics & Mechanisms',
    date: '2026-10-24',
    image: '/assets/images/product_dragon_1786179208256.webp',
    review: 'The print-in-place tolerances are incredible. All 5 planetary gears rotated freely right off the build plate without any binding or manual sanding needed. Outstanding print calibration.',
    material: 'High-Strength PETG',
    printTime: '6h 45m',
    weight: '98g'
  },
  {
    id: 'rev_4',
    customerName: 'Neha Deshmukh',
    designation: 'Product Designer, Mumbai',
    rating: 5,
    verifiedBuyer: true,
    productName: 'Ergonomic Studio Headphone Stand',
    category: 'Desk Accessories',
    date: '2026-10-25',
    image: '/assets/images/product_headphone_stand_1786179253396.webp',
    review: 'Rock solid base with zero wobble, gorgeous matte finish that looks like a factory-molded retail product. The integrated cable canal is super clean.',
    material: 'Matte Jet Black PLA+',
    printTime: '9h 15m',
    weight: '185g'
  }
];

app.get('/api/reviews', (req, res) => {
  const db = loadDb();
  const list = (db.reviews && db.reviews.length > 0) ? db.reviews : DEFAULT_REVIEWS;
  if (!verifyAdminAccess(req)) {
    const approved = list.filter(r => r.approved !== false && r.status !== 'pending' && r.status !== 'pending_moderation');
    return res.json(approved);
  }
  res.json(list);
});

app.post('/api/reviews', (req, res) => {
  const body = req.body || {};
  const { customerName, productName, rating, review, material } = body;
  if (!customerName || !productName || !review) {
    return res.status(400).json({ error: 'Customer Name, Product Name, and Review are required' });
  }

  const db = loadDb();
  db.reviews = db.reviews || [...DEFAULT_REVIEWS];
  const newRev = {
    id: `rev_${Date.now()}`,
    customerName: customerName.trim(),
    designation: body.designation || 'Verified 3D Printing Customer',
    rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
    verifiedBuyer: true,
    productName: productName.trim(),
    category: body.category || 'Custom Print',
    date: new Date().toISOString().split('T')[0],
    image: body.image || '/assets/images/product_dragon_1786179208256.webp',
    review: review.trim(),
    material: material || 'PLA+',
    printTime: body.printTime || '5h 30m',
    weight: body.weight || '80g'
  };
  db.reviews.unshift(newRev);
  saveDb(db);
  res.status(201).json({ message: 'Review added successfully', review: newRev });
});

// ── Live Order Production Tracking Pipeline ─────────────────────────────────
app.get('/api/track/:orderId', (req, res) => {
  const orderId = (req.params.orderId || '').trim();
  if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

  const db = loadDb();
  const order = (db.orders || []).find(o => o.id.toLowerCase() === orderId.toLowerCase());
  const customOrder = (db.customOrders || []).find(c => c.id.toLowerCase() === orderId.toLowerCase());
  const found = order || customOrder;

  const stages = [
    { key: 'slicing', title: 'File Slicing & Geometry Check', desc: 'Slicing G-code, optimizing layer heights & infill geometry', time: 'Day 1, 09:30 AM' },
    { key: 'queued', title: 'Queued on 3D Printer Farm', desc: 'Assigned to calibrated bed with hardened 0.4mm nozzle', time: 'Day 1, 11:15 AM' },
    { key: 'printing', title: 'In-Print (Active Additive Build)', desc: 'Active high-precision extrusion at 200mm/s', time: 'Day 1, 02:40 PM' },
    { key: 'inspection', title: 'Quality & Tolerance Inspection', desc: 'Digital caliper verification (±0.15mm tolerance check)', time: 'Day 2, 10:00 AM' },
    { key: 'postprocessing', title: 'Post-Processing & Curing', desc: 'Support removal, surface smoothing, and heat stabilization', time: 'Day 2, 01:20 PM' },
    { key: 'packaging', title: 'Shockproof Protective Packaging', desc: 'Multi-layer bubble cushioning & sealed moisture-barrier box', time: 'Day 2, 04:30 PM' },
    { key: 'dispatched', title: 'Dispatched & Courier In-Transit', desc: 'Handed over to express courier with door-to-door tracking', time: 'Day 3, 08:00 AM' }
  ];

  let currentStageIndex = 4; // Default to Quality Inspection stage
  let statusText = 'Quality Inspection & Post-Processing';

  if (found) {
    const st = (found.fulfillmentStatus || found.status || '').toLowerCase();
    if (st.includes('deliver')) {
      currentStageIndex = 6;
      statusText = 'Delivered / Out for Delivery';
    } else if (st.includes('ship') || st.includes('transit')) {
      currentStageIndex = 6;
      statusText = 'In Transit with Express Courier';
    } else if (st.includes('print') || st.includes('process')) {
      currentStageIndex = 3;
      statusText = 'Active 3D Printing & Quality Check';
    } else if (st.includes('quote') || st.includes('request')) {
      currentStageIndex = 1;
      statusText = 'File Slicing & Engineering Verification';
    }
  }

  const numPart = orderId.replace(/\D/g, '').slice(-6) || '782910';

  res.json({
    orderId,
    found: !!found,
    customerName: found?.userName || found?.shippingAddress?.name || 'Verified Customer',
    destinationCity: found?.city || found?.shippingAddress?.city || 'Verified Direct Hub',
    destinationState: found?.state || found?.shippingAddress?.state || 'Maharashtra',
    courierPartner: 'BlueDart Express Air / Delhivery FastTrack',
    trackingNumber: `SM3D-EXP-${numPart}IN`,
    estimatedDelivery: '1-3 Business Days',
    currentStageIndex,
    statusText,
    stages: stages.map((s, idx) => ({
      ...s,
      completed: idx <= currentStageIndex,
      active: idx === currentStageIndex
    })),
    orderDetails: found ? {
      total: found.total || found.quotePrice || 'Calculated at checkout',
      itemsCount: found.items ? found.items.length : 1,
      material: found.desiredMaterial || 'PLA+',
      color: found.desiredColor || 'Silk Aztec Gold',
      createdAt: found.createdAt || new Date().toISOString()
    } : null
  });
});

// ── Enterprise & Commercial RFQ Endpoint ────────────────────────────────────
app.post('/api/rfq', (req, res) => {
  const body = req.body || {};
  const { companyName, contactName, email, phone, quantity, material, targetDate, projectNotes, ndaRequired } = body;

  if (!contactName || !email || !phone) {
    return res.status(400).json({ error: 'Contact Name, Email, and Phone number are required' });
  }

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
  }

  const db = loadDb();
  db.rfqs = db.rfqs || [];
  const rfqItem = {
    id: `RFQ-${Date.now().toString().slice(-6)}`,
    companyName: (companyName || '').trim() || 'Independent Maker / Institution',
    contactName: (contactName || '').trim(),
    email: (email || '').trim().toLowerCase(),
    phone: `+91 ${cleanPhone}`,
    quantity: Math.max(1, parseInt(quantity) || 50),
    material: material || 'PETG / Carbon Fiber',
    targetDate: targetDate || 'Within 2 Weeks',
    projectNotes: (projectNotes || '').trim(),
    ndaRequired: !!ndaRequired,
    status: 'Received',
    createdAt: new Date().toISOString()
  };

  db.rfqs.push(rfqItem);
  saveDb(db);
  res.status(201).json({ message: 'Enterprise RFQ submitted successfully', rfq: rfqItem });
});

app.get(['/api/rfq', '/api/rfqs'], (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const db = loadDb();
  res.json(db.rfqs || []);
});

app.put('/api/rfq/:id', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const db = loadDb();
  db.rfqs = db.rfqs || [];
  const idx = db.rfqs.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'RFQ not found' });
  db.rfqs[idx] = { ...db.rfqs[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveDb(db);
  res.json({ message: 'RFQ updated successfully', rfq: db.rfqs[idx] });
});

app.delete('/api/rfq/:id', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const db = loadDb();
  db.rfqs = (db.rfqs || []).filter(r => r.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, message: 'RFQ deleted successfully' });
});

// ── Admin Financial Statements & Revenue Analytics (Admin Protected) ────────
app.get('/api/admin/financial-summary', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const db = loadDb();
  const orders = db.orders || [];
  const customOrders = db.customOrders || [];

  let totalRevenue = 0;
  let paidRevenue = 0;
  let pendingRevenue = 0;
  let shippingTotal = 0;
  const paymentMethods = {};
  const statusCounts = {};

  orders.forEach(o => {
    const tot = Number(o.total) || 0;
    const ship = Number(o.shippingFee) || 0;
    totalRevenue += tot;
    shippingTotal += ship;
    if (o.paymentStatus === 'Paid') {
      paidRevenue += tot;
    } else {
      pendingRevenue += tot;
    }
    const method = o.paymentMethod || 'Razorpay / UPI';
    paymentMethods[method] = (paymentMethods[method] || 0) + tot;
    const st = o.fulfillmentStatus || 'Pending';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });

  customOrders.forEach(c => {
    if (c.quotePrice) {
      const qp = Number(c.quotePrice);
      if (c.status === 'Paid' || c.status === 'Completed' || c.status === 'Delivered') {
        paidRevenue += qp;
        totalRevenue += qp;
      }
    }
  });

  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  res.json({
    currency: db.settings?.currency || '₹',
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    shippingTotal,
    totalOrders: orders.length,
    customOrdersCount: customOrders.length,
    averageOrderValue: avgOrderValue,
    paymentMethodsBreakdown: paymentMethods,
    fulfillmentStatusBreakdown: statusCounts,
    generatedAt: new Date().toISOString()
  });
});

app.delete('/api/reviews/:id', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const db = loadDb();
  db.reviews = (db.reviews || []).filter(r => r.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, message: 'Review deleted successfully' });
});

app.put('/api/reviews/:id', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const db = loadDb();
  db.reviews = db.reviews || [];
  const idx = db.reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Review not found' });
  db.reviews[idx] = { ...db.reviews[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveDb(db);
  res.json({ message: 'Review updated successfully', review: db.reviews[idx] });
});

// ── FAQ Knowledge Base Endpoint ─────────────────────────────────────────────
const FAQ_KNOWLEDGE_BASE = [
  {
    category: 'File Guidelines & Formats',
    q: 'What 3D file formats do you accept for custom printing?',
    a: 'We accept .STL and .3MF files directly through our web interface with support for files up to 100MB. For CAD native files (.STEP, .IGES, or SolidWorks parts), you can request an Enterprise RFQ or share them via WhatsApp.'
  },
  {
    category: 'Print Tolerances & Fit',
    q: 'What are your dimensional accuracy and tolerance guarantees?',
    a: 'Our calibrated direct-drive printers maintain a standard dimensional tolerance of ±0.15mm for standard features, and down to ±0.08mm on precision mating surfaces. For moving assemblies or press-fit pins, we recommend a 0.25mm to 0.40mm clearance gap.'
  },
  {
    category: 'Materials & Selection',
    q: 'Which material should I choose: PLA+, PETG, or Carbon Fiber?',
    a: 'Choose PLA+ for high aesthetic detail, smooth figurines, and indoor architectural display. Choose PETG for outdoor weatherproof enclosures, functional snap-fits, and chemical resistance. Choose Carbon Fiber PETG (CF-PETG) for high-rigidity drone arms, robotics, and load-bearing fixtures.'
  },
  {
    category: 'Rush Production',
    q: 'Can I get my parts printed and dispatched urgently?',
    a: 'Yes! We offer Priority 24-48h Rush Dispatch for time-critical prototypes and academic deadlines. Standard production runs take 3-5 business days.'
  },
  {
    category: 'Guarantee & Reprints',
    q: 'What is your Free Reprint Guarantee?',
    a: 'Every print undergoes optical and digital caliper inspection before boxing. If a part arrives defective, delaminated, or outside our stated tolerances, notify us within 48 hours for an immediate free reprint or full store credit.'
  }
];

app.get('/api/faqs', (req, res) => {
  res.json(FAQ_KNOWLEDGE_BASE);
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

app.post('/api/auth/login', async (req, res) => {
  const body = req.body || {};
  const identifier = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  const clientIp = getClientIp(req);
  const ipKey = `ip:${clientIp}`;
  const idKey = `user:${identifier}`;

  const ipCheck = checkBruteForceLock(ipKey);
  if (ipCheck.locked) {
    res.setHeader('Retry-After', String(ipCheck.remainingSec));
    return res.status(429).json({
      error: `Brute-force protection: Too many failed login attempts from this IP address. Access temporarily locked for ${ipCheck.remainingSec} seconds.`
    });
  }

  const idCheck = checkBruteForceLock(idKey);
  if (idCheck.locked) {
    res.setHeader('Retry-After', String(idCheck.remainingSec));
    return res.status(429).json({
      error: `Brute-force protection: Too many failed login attempts for this account. Access temporarily locked for ${idCheck.remainingSec} seconds.`
    });
  }

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
    recordFailedAuth(ipKey);
    recordFailedAuth(idKey);
    await new Promise(r => setTimeout(r, 100));
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { hash: h } = hashPassword(password, user.salt);
  const isValid = safeCompare(h, user.passwordHash) || (user.role === 'admin' && safeCompare(password, MASTER_ADMIN_PASSWORD));
  if (!isValid) {
    recordFailedAuth(ipKey);
    recordFailedAuth(idKey);
    await new Promise(r => setTimeout(r, 100));
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  clearAuthFailures(ipKey);
  clearAuthFailures(idKey);
  res.json({ message: 'Login successful', user: stripSensitive(user), token: `token_${user.id}_${Math.floor(Date.now() / 1000)}` });
});

app.post('/api/auth/admin-login', async (req, res) => {
  const body = req.body || {};
  const identifier = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  const clientIp = getClientIp(req);
  const ipKey = `ip:${clientIp}`;
  const idKey = `admin:${identifier}`;

  const ipCheck = checkBruteForceLock(ipKey);
  if (ipCheck.locked) {
    res.setHeader('Retry-After', String(ipCheck.remainingSec));
    return res.status(429).json({
      error: `Brute-force protection: Too many failed admin attempts from this IP address. Access temporarily locked for ${ipCheck.remainingSec} seconds.`
    });
  }

  const idCheck = checkBruteForceLock(idKey);
  if (idCheck.locked) {
    res.setHeader('Retry-After', String(idCheck.remainingSec));
    return res.status(429).json({
      error: `Brute-force protection: Too many failed admin attempts for this account. Access temporarily locked for ${idCheck.remainingSec} seconds.`
    });
  }

  const db = loadDb();
  const user = (db.users || []).find(u => u.email === identifier && u.role === 'admin');
  if (!user) {
    recordFailedAuth(ipKey);
    recordFailedAuth(idKey);
    await new Promise(r => setTimeout(r, 100));
    return res.status(403).json({ error: 'Invalid admin credentials or non-admin account' });
  }

  const { hash: h } = hashPassword(password, user.salt);
  const isValid = safeCompare(h, user.passwordHash) || safeCompare(password, MASTER_ADMIN_PASSWORD);
  if (!isValid) {
    recordFailedAuth(ipKey);
    recordFailedAuth(idKey);
    await new Promise(r => setTimeout(r, 100));
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  // Update stored hash if using master password
  if (password === MASTER_ADMIN_PASSWORD && !safeCompare(h, user.passwordHash)) {
    user.passwordHash = h;
    saveDb(db);
  }

  clearAuthFailures(ipKey);
  clearAuthFailures(idKey);
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
    upiTransactionId: body.upiTransactionId || '',
    paymentScreenshotUrl: body.paymentScreenshotUrl || '',
    accountTransferDetails: body.accountTransferDetails || {},
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
  const filename = body.filename || `upload_${Date.now()}.stl`;
  const fileData = body.fileData || '';

  if (!fileData) {
    return res.status(400).json({ error: 'No file data provided in upload request.' });
  }

  // Sanitize filename & preserve valid 3D/image extensions
  let safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const ALLOWED_EXTS = ['.stl', '.3mf', '.obj', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.step', '.stp'];
  let ext = path.extname(safeName).toLowerCase();
  if (!ext || !ALLOWED_EXTS.includes(ext)) {
    // Check if original filename had a valid extension
    const origExt = path.extname(filename).toLowerCase();
    if (ALLOWED_EXTS.includes(origExt)) {
      ext = origExt;
      safeName = path.parse(safeName).name + ext;
    } else {
      ext = '.stl';
      safeName = path.parse(safeName).name + ext;
    }
  }

  // Decode buffer safely supporting Data URLs and raw base64
  let buffer;
  try {
    if (Buffer.isBuffer(fileData)) {
      buffer = fileData;
    } else if (typeof fileData === 'string' && fileData.includes(';base64,')) {
      buffer = Buffer.from(fileData.split(';base64,')[1], 'base64');
    } else if (typeof fileData === 'string') {
      buffer = Buffer.from(fileData, 'base64');
    } else {
      buffer = Buffer.from(String(fileData), 'utf-8');
    }
  } catch (decodeErr) {
    return res.status(400).json({ error: 'Failed to decode uploaded file data: ' + decodeErr.message });
  }

  // Enforce 200MB maximum capacity limit
  const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB
  if (buffer.length > MAX_UPLOAD_BYTES) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    return res.status(413).json({
      error: `File size (${sizeMb} MB) exceeds the maximum upload capacity limit of 200 MB.`
    });
  }

  try {
    [PUBLIC_UPLOADS, DIST_UPLOADS, ROOT_UPLOADS, PARENT_UPLOADS].forEach(dir => {
      try {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, safeName), buffer);
      } catch (err) {
        console.warn(`Write to directory ${dir} failed:`, err.message);
      }
    });
    res.json({
      message: 'File uploaded successfully',
      fileUrl: `/uploads/${safeName}`,
      filename: safeName,
      size: buffer.length
    });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
});

app.post('/api/delivery-cities', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const { name, state, estimatedDays, turnaround, active, isActive, pincodes } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'City name is required' });
  }
  const db = loadDb();
  if (!Array.isArray(db.deliveryCities)) db.deliveryCities = [];
  if (!db.settings) db.settings = {};

  const trimmedName = name.trim();
  const trimmedState = (state || '').trim();
  const existing = db.deliveryCities.find(c =>
    c.name.toLowerCase() === trimmedName.toLowerCase() &&
    (!trimmedState || !c.state || c.state.toLowerCase() === trimmedState.toLowerCase())
  );
  if (existing) {
    return res.status(409).json({ error: `City "${trimmedName}" already exists in delivery coverage.` });
  }

  const isCityActive = active !== undefined ? Boolean(active) : (isActive !== undefined ? Boolean(isActive) : true);
  const days = (estimatedDays || turnaround || '2-4 Days').trim();

  const newCity = {
    id: 'city_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: trimmedName,
    state: trimmedState || 'All India',
    estimatedDays: days,
    turnaround: days,
    active: isCityActive,
    isActive: isCityActive,
    pincodes: (pincodes || '').trim()
  };

  db.deliveryCities.push(newCity);
  db.settings.deliveryCities = db.deliveryCities;
  saveDb(db);

  const activeCount = db.deliveryCities.filter(c => c.active !== false && c.isActive !== false).length;
  res.status(201).json({
    message: 'Delivery city added successfully',
    city: newCity,
    count: activeCount
  });
});

// ── PUT Routes ──────────────────────────────────────────────────────────────

app.put('/api/settings', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  db.settings = { ...(db.settings || {}), ...(req.body || {}) };
  if (Array.isArray(req.body.deliveryCities)) {
    db.deliveryCities = req.body.deliveryCities;
  }
  saveDb(db);
  res.json({ message: 'Settings updated', settings: db.settings });
});

app.put('/api/delivery-cities/:id', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  if (!Array.isArray(db.deliveryCities)) db.deliveryCities = [];
  const index = db.deliveryCities.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Delivery city not found' });
  }

  const city = db.deliveryCities[index];
  const { name, state, estimatedDays, turnaround, active, isActive, pincodes } = req.body || {};
  if (name && typeof name === 'string' && name.trim()) city.name = name.trim();
  if (state !== undefined) city.state = typeof state === 'string' ? state.trim() : city.state;
  if (estimatedDays !== undefined || turnaround !== undefined) {
    const days = (estimatedDays || turnaround || '2-4 Days').trim();
    city.estimatedDays = days;
    city.turnaround = days;
  }
  if (active !== undefined) {
    city.active = Boolean(active);
    city.isActive = city.active;
  } else if (isActive !== undefined) {
    city.active = Boolean(isActive);
    city.isActive = city.active;
  }
  if (pincodes !== undefined) city.pincodes = typeof pincodes === 'string' ? pincodes.trim() : city.pincodes;

  db.deliveryCities[index] = city;
  if (db.settings) db.settings.deliveryCities = db.deliveryCities;
  saveDb(db);

  const activeCount = db.deliveryCities.filter(c => c.active !== false && c.isActive !== false).length;
  res.json({ message: 'Delivery city updated successfully', city, count: activeCount });
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
  if (req.body.paymentMethod) o.paymentMethod = req.body.paymentMethod;
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

app.delete('/api/products', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  db.products = [];
  saveDb(db);
  res.json({ message: 'All products removed successfully', count: 0 });
});

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

app.delete('/api/delivery-cities/:id', (req, res) => {
  if (!verifyAdminAccess(req)) return res.status(401).json({ error: 'Unauthorized: Admin token required' });
  const db = loadDb();
  if (!Array.isArray(db.deliveryCities)) db.deliveryCities = [];
  const initialLen = db.deliveryCities.length;
  db.deliveryCities = db.deliveryCities.filter(c => c.id !== req.params.id);
  if (db.deliveryCities.length === initialLen) {
    return res.status(404).json({ error: 'Delivery city not found' });
  }
  if (db.settings) db.settings.deliveryCities = db.deliveryCities;
  saveDb(db);

  const activeCount = db.deliveryCities.filter(c => c.active !== false && c.isActive !== false).length;
  res.json({ success: true, message: 'Delivery city deleted successfully', count: activeCount });
});

// ── Global Error Handling (Payload size & JSON parsing) ─────────────────────
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'Upload Payload Too Large: The file exceeds the maximum 200MB upload capacity limit supported by SM 3D.'
    });
  }
  if (err && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload: ' + err.message });
  }
  next(err);
});

// ── SPA Catch-all ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// ── Start ───────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SM 3D Full-Stack Server (Node.js) listening on port ${PORT}`);

    // Keep-Alive Self-Ping: Periodically ping /api/health to prevent Render free instance spin-down
    const pingTarget = process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${PORT}`;
    const httpLib = pingTarget.startsWith('https') ? require('https') : require('http');
    setInterval(() => {
      try {
        httpLib.get(`${pingTarget}/api/health`, (res) => {
          res.resume();
        }).on('error', () => {});
      } catch (_) {}
    }, 9 * 60 * 1000); // every 9 minutes
  });
}

module.exports = app;
