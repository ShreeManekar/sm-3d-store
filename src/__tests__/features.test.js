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
  });
});
