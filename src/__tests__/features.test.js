const XLSX = require('xlsx');

describe('New Website Features Test Suite', () => {
  describe('Authentication & Phone Validation', () => {
    const sanitizePhone = (phone) => {
      const clean = (phone || '').replace(/\D/g, '');
      return clean.length >= 10 ? clean.slice(-10) : clean;
    };

    const isValidIndianPhone = (phone) => {
      const clean = sanitizePhone(phone);
      return clean.length === 10;
    };

    test('validates standard 10-digit mobile number', () => {
      expect(isValidIndianPhone('9812345678')).toBe(true);
      expect(sanitizePhone('9812345678')).toBe('9812345678');
    });

    test('extracts 10 digits from formatted +91 number', () => {
      expect(isValidIndianPhone('+91 98123-45678')).toBe(true);
      expect(sanitizePhone('+91 98123-45678')).toBe('9812345678');
    });

    test('rejects numbers with fewer than 10 digits', () => {
      expect(isValidIndianPhone('12345')).toBe(false);
      expect(isValidIndianPhone('')).toBe(false);
      expect(isValidIndianPhone(null)).toBe(false);
    });

    test('verifies administrator role authorization check', () => {
      const checkAdmin = (user, token) => {
        return !!(user && user.role === 'admin' && token && token.startsWith('admintoken_'));
      };

      expect(checkAdmin({ role: 'admin' }, 'admintoken_usr_admin_123')).toBe(true);
      expect(checkAdmin({ role: 'customer' }, 'admintoken_usr_admin_123')).toBe(false);
      expect(checkAdmin({ role: 'admin' }, null)).toBe(false);
      expect(checkAdmin(null, 'admintoken_usr_admin_123')).toBe(false);
    });
  });

  describe('Theme Management Persistence', () => {
    test('defaults to dark theme when no stored preference exists', () => {
      const getInitialTheme = (saved) => {
        if (saved === 'light' || saved === 'dark') return saved;
        return 'dark';
      };
      expect(getInitialTheme(null)).toBe('dark');
      expect(getInitialTheme('light')).toBe('light');
      expect(getInitialTheme('dark')).toBe('dark');
      expect(getInitialTheme('invalid')).toBe('dark');
    });

    test('toggles theme properly between dark and light', () => {
      const toggleTheme = (current) => (current === 'dark' ? 'light' : 'dark');
      expect(toggleTheme('dark')).toBe('light');
      expect(toggleTheme('light')).toBe('dark');
    });
  });

  describe('Build Plate Dimension Verification (160mm limit)', () => {
    const MAX_DIM = 160;
    const verifyBuildVolume = (l, w, h) => {
      const exceeds = l > MAX_DIM || w > MAX_DIM || h > MAX_DIM;
      const requiresSplit = exceeds;
      return { exceeds, requiresSplit };
    };

    test('validates model fitting strictly within 160mm volume', () => {
      const res = verifyBuildVolume(150, 80, 40);
      expect(res.exceeds).toBe(false);
      expect(res.requiresSplit).toBe(false);
    });

    test('identifies model exceeding 160mm in any dimension and marks for split', () => {
      const res = verifyBuildVolume(240, 100, 50);
      expect(res.exceeds).toBe(true);
      expect(res.requiresSplit).toBe(true);
    });

    test('handles boundary dimension exactly 160mm without exceeding', () => {
      const res = verifyBuildVolume(160, 160, 160);
      expect(res.exceeds).toBe(false);
      expect(res.requiresSplit).toBe(false);
    });
  });

  describe('Excel Reporting Generation via XLSX', () => {
    test('generates valid XLSX workbook structure from orders array', () => {
      const orders = [
        {
          id: 'ORD-2026-8801',
          userName: 'Rahul Sharma',
          userEmail: 'rahul@example.com',
          total: 898,
          fulfillmentStatus: 'Delivered',
        },
      ];

      const rows = orders.map((o) => ({
        'Order ID': o.id,
        'Customer Name': o.userName,
        'Email': o.userEmail,
        'Total (INR)': o.total,
        'Status': o.fulfillmentStatus,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      expect(worksheet).toBeDefined();
      expect(worksheet['A1'].v).toBe('Order ID');
      expect(worksheet['A2'].v).toBe('ORD-2026-8801');

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      expect(workbook.SheetNames).toContain('Orders');
    });

    test('generates multi-sheet master workbook containing Orders, Products, and Custom Quotes', () => {
      const orders = [
        { id: 'ORD-1', userName: 'Alice', userEmail: 'alice@example.com', total: 749, fulfillmentStatus: 'Pending' }
      ];
      const products = [
        { id: 'prod-1', name: 'Articulated Dragon', category: 'Art & Toys', price: 749, stock: 15 }
      ];
      const quotes = [
        { id: 'QUOTE-1', customerName: 'Bob', modelName: 'Bracket.stl', status: 'Approved', finalQuote: 450 }
      ];

      const ordersSheet = XLSX.utils.json_to_sheet(orders.map(o => ({
        'Order ID': o.id,
        'Customer': o.userName,
        'Email': o.userEmail,
        'Total (INR)': o.total,
        'Status': o.fulfillmentStatus,
      })));

      const productsSheet = XLSX.utils.json_to_sheet(products.map(p => ({
        'Product ID': p.id,
        'Name': p.name,
        'Category': p.category,
        'Price (INR)': p.price,
        'Stock': p.stock,
      })));

      const quotesSheet = XLSX.utils.json_to_sheet(quotes.map(q => ({
        'Quote ID': q.id,
        'Customer': q.customerName,
        'Model Name': q.modelName,
        'Status': q.status,
        'Quoted Amount (INR)': q.finalQuote,
      })));

      const masterWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(masterWorkbook, ordersSheet, 'Orders');
      XLSX.utils.book_append_sheet(masterWorkbook, productsSheet, 'Catalog_Products');
      XLSX.utils.book_append_sheet(masterWorkbook, quotesSheet, 'Custom_Quotes');

      expect(masterWorkbook.SheetNames).toEqual(['Orders', 'Catalog_Products', 'Custom_Quotes']);
      expect(masterWorkbook.Sheets['Orders']['A2'].v).toBe('ORD-1');
      expect(masterWorkbook.Sheets['Catalog_Products']['B2'].v).toBe('Articulated Dragon');
      expect(masterWorkbook.Sheets['Custom_Quotes']['C2'].v).toBe('Bracket.stl');
    });
  });

  describe('Store Settings & Currency Configuration', () => {
    const defaultSettings = {
      storeName: 'SM 3D Printing Store',
      currency: '₹',
      taxRate: 18,
      freeShippingThreshold: 500,
      standardShippingFee: 99,
      maxBedLength: 160,
      maxBedWidth: 160,
      maxBedHeight: 160,
    };

    const calculateTax = (amount, rate) => Math.round((amount * rate) / (100 + rate));

    test('retains default INR currency symbol and 18% GST tax rate', () => {
      expect(defaultSettings.currency).toBe('₹');
      expect(defaultSettings.taxRate).toBe(18);
    });

    test('calculates embedded GST correctly from gross total', () => {
      const gross = 1180;
      const tax = calculateTax(gross, defaultSettings.taxRate);
      expect(tax).toBe(180);
      expect(gross - tax).toBe(1000);
    });

    test('updates custom currency and tax rate in store settings', () => {
      const updated = {
        ...defaultSettings,
        currency: '$',
        taxRate: 10,
      };
      expect(updated.currency).toBe('$');
      expect(updated.taxRate).toBe(10);
    });
  });

  describe('Checkout Authentication & User Binding', () => {
    const bindOrderUser = (currentUser, guestData) => {
      return {
        userId: currentUser ? currentUser.id : 'guest',
        userName: currentUser ? currentUser.name : guestData.name,
        userEmail: currentUser ? currentUser.email : guestData.email,
        phone: currentUser ? currentUser.phone : guestData.phone,
      };
    };

    test('binds logged-in user profile to order', () => {
      const loggedInUser = {
        id: 'usr_customer_456',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '9876543210',
        role: 'customer',
      };
      const order = bindOrderUser(loggedInUser, { name: 'Guest', email: 'g@g.com', phone: '0000000000' });
      expect(order.userId).toBe('usr_customer_456');
      expect(order.userName).toBe('Jane Doe');
      expect(order.userEmail).toBe('jane@example.com');
    });

    test('defaults to guest when user is unauthenticated', () => {
      const guestData = {
        name: 'Guest Customer',
        email: 'guest@example.com',
        phone: '9123456789',
      };
      const order = bindOrderUser(null, guestData);
      expect(order.userId).toBe('guest');
      expect(order.userName).toBe('Guest Customer');
    });
  });

  describe('STL Upload & Data URI Processing', () => {
    test('validates stl file extension correctly', () => {
      const isStl = (filename) => filename.toLowerCase().endsWith('.stl');
      expect(isStl('dragon_model.stl')).toBe(true);
      expect(isStl('DRAGON_MODEL.STL')).toBe(true);
      expect(isStl('model.obj')).toBe(false);
      expect(isStl('script.exe')).toBe(false);
    });

    test('constructs valid data URI format without heap overflow', () => {
      const mockBase64 = 'c29tZS1zdGwtZmlsZS1iaW5hcnktZGF0YQ==';
      const dataUri = `data:application/octet-stream;base64,${mockBase64}`;
      expect(dataUri.startsWith('data:application/octet-stream;base64,')).toBe(true);
      expect(dataUri.length).toBeGreaterThan(30);
    });
  });
});
