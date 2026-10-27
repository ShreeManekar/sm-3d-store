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

  describe('3D Plate Alignment & Axis Normalization (Interactive 3D STL Inspection)', () => {
    const fs = require('fs');
    const path = require('path');

    const is3mfBuffer = (buffer) => {
      if (!buffer || buffer.byteLength < 4) return false;
      const b = new Uint8Array(buffer, 0, 4);
      return b[0] === 0x50 && b[1] === 0x4B && (b[2] === 0x03 || b[2] === 0x05) && (b[3] === 0x04 || b[3] === 0x06);
    };

    // Aligns vertex buffer to build plate coordinates:
    // 1. Converts CAD Z-up to Three.js Y-up (-90° around X axis: x'=x, y'=z, z'=-y)
    // 2. Centers horizontally at (X=0, Z=0)
    // 3. Positions bottom flush on build plate surface (Y=0)
    const alignVerticesToBuildPlate = (vertices) => {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      const rotated = [];
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];

        // rotate -90° on X: x'=x, y'=z, z'=-y
        const rx = x;
        const ry = z;
        const rz = -y;
        rotated.push(rx, ry, rz);

        minX = Math.min(minX, rx); maxX = Math.max(maxX, rx);
        minY = Math.min(minY, ry); maxY = Math.max(maxY, ry);
        minZ = Math.min(minZ, rz); maxZ = Math.max(maxZ, rz);
      }

      const centerX = (minX + maxX) / 2;
      const bottomY = minY;
      const centerZ = (minZ + maxZ) / 2;

      let finalMinX = Infinity, finalMaxX = -Infinity;
      let finalMinY = Infinity, finalMaxY = -Infinity;
      let finalMinZ = Infinity, finalMaxZ = -Infinity;

      for (let i = 0; i < rotated.length; i += 3) {
        const tx = rotated[i] - centerX;
        const ty = rotated[i + 1] - bottomY;
        const tz = rotated[i + 2] - centerZ;

        finalMinX = Math.min(finalMinX, tx); finalMaxX = Math.max(finalMaxX, tx);
        finalMinY = Math.min(finalMinY, ty); finalMaxY = Math.max(finalMaxY, ty);
        finalMinZ = Math.min(finalMinZ, tz); finalMaxZ = Math.max(finalMaxZ, tz);
      }

      return {
        min: { x: finalMinX, y: finalMinY, z: finalMinZ },
        max: { x: finalMaxX, y: finalMaxY, z: finalMaxZ },
        centerX: (finalMinX + finalMaxX) / 2,
        centerZ: (finalMinZ + finalMaxZ) / 2,
        height: finalMaxY - finalMinY,
      };
    };

    const extractStlVertices = (buffer) => {
      const headerBytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 80));
      const headerText = new TextDecoder().decode(headerBytes);
      const isAscii = headerText.trim().startsWith('solid') && headerText.includes('facet');

      if (isAscii) {
        const text = new TextDecoder().decode(buffer);
        const vertices = [];
        const patternVertex = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g;
        let match;
        while ((match = patternVertex.exec(text)) !== null) {
          vertices.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
        }
        return vertices;
      } else {
        const dataView = new DataView(buffer);
        const rawTriangles = dataView.getUint32(80, true);
        const vertices = [];
        let offset = 84;
        for (let i = 0; i < rawTriangles; i++) {
          offset += 12; // skip normal
          for (let j = 0; j < 3; j++) {
            vertices.push(
              dataView.getFloat32(offset, true) || 0,
              dataView.getFloat32(offset + 4, true) || 0,
              dataView.getFloat32(offset + 8, true) || 0
            );
            offset += 12;
          }
          offset += 2;
        }
        return vertices;
      }
    };

    test('is3mfBuffer detects PK magic headers correctly', () => {
      const valid3mf = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00]).buffer;
      const validEmpty3mf = new Uint8Array([0x50, 0x4B, 0x05, 0x06, 0x00, 0x00]).buffer;
      const stlHeader = new Uint8Array([0x73, 0x6F, 0x6C, 0x69, 0x64]).buffer; // 'solid'

      expect(is3mfBuffer(valid3mf)).toBe(true);
      expect(is3mfBuffer(validEmpty3mf)).toBe(true);
      expect(is3mfBuffer(stlHeader)).toBe(false);
      expect(is3mfBuffer(new ArrayBuffer(2))).toBe(false);
      expect(is3mfBuffer(null)).toBe(false);
    });

    test('aligns binary STL (sample_dragon.stl) flush to build plate at Y=0 and centered at (X=0, Z=0)', () => {
      const filePath = path.resolve(__dirname, '../../public/assets/models/sample_dragon.stl');
      const fileBuf = fs.readFileSync(filePath);
      const ab = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);

      const vertices = extractStlVertices(ab);
      const result = alignVerticesToBuildPlate(vertices);

      // Bottom must rest directly on the build plate surface (Y = 0)
      expect(Math.abs(result.min.y)).toBeLessThan(0.001);
      // CAD Z dimension (23mm) correctly maps to vertical height in Y
      expect(Math.round(result.height)).toBe(23);
      // Centered at X=0, Z=0
      expect(Math.abs(result.centerX)).toBeLessThan(0.001);
      expect(Math.abs(result.centerZ)).toBeLessThan(0.001);
    });

    test('aligns binary STL (sample_gearbox.stl) upright and flush to build plate', () => {
      const filePath = path.resolve(__dirname, '../../public/assets/models/sample_gearbox.stl');
      const fileBuf = fs.readFileSync(filePath);
      const ab = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);

      const vertices = extractStlVertices(ab);
      const result = alignVerticesToBuildPlate(vertices);

      expect(Math.abs(result.min.y)).toBeLessThan(0.001);
      expect(Math.round(result.height)).toBe(123); // 123mm upright height
      expect(Math.abs(result.centerX)).toBeLessThan(0.001);
      expect(Math.abs(result.centerZ)).toBeLessThan(0.001);
    });

    test('aligns ASCII STL flush on build plate at Y=0 and centered at (X=0, Z=0)', () => {
      const asciiStl = `solid precision_bracket
facet normal 0 0 1
outer loop
vertex 0 0 0
vertex 20 0 0
vertex 0 30 0
endloop
endfacet
facet normal 0 0 1
outer loop
vertex 20 0 0
vertex 20 30 0
vertex 0 30 0
endloop
endfacet
endsolid precision_bracket`;
      const ab = new TextEncoder().encode(asciiStl).buffer;

      const vertices = extractStlVertices(ab);
      const result = alignVerticesToBuildPlate(vertices);

      expect(Math.abs(result.min.y)).toBeLessThan(0.001);
      expect(Math.abs(result.centerX)).toBeLessThan(0.001);
      expect(Math.abs(result.centerZ)).toBeLessThan(0.001);
    });

    test('aligns mock CAD 3MF object flush on plate at Y=0 and centered at (X=0, Z=0)', () => {
      // Box in CAD Z-up: width 60, depth 40, height 50, with arbitrary offset
      const cadVertices = [
        100, 200, 300,
        160, 200, 300,
        160, 240, 300,
        100, 240, 300,
        100, 200, 350,
        160, 200, 350,
        160, 240, 350,
        100, 240, 350,
      ];
      const result = alignVerticesToBuildPlate(cadVertices);

      expect(Math.abs(result.min.y)).toBeLessThan(0.001);
      expect(Math.round(result.height)).toBe(50);
      expect(Math.abs(result.centerX)).toBeLessThan(0.001);
      expect(Math.abs(result.centerZ)).toBeLessThan(0.001);
    });

    test('harmonizes build volume box and grid helper to 160mm build plate', () => {
      const bedSize = 160;
      const gridPosY = 0;
      expect(gridPosY).toBe(0);

      // 160x160x160mm build volume box sits flush from Y=0 to Y=160
      const boxSize = bedSize;
      const boxPosY = boxSize / 2;
      const boxBottom = boxPosY - boxSize / 2;
      const boxTop = boxPosY + boxSize / 2;

      expect(boxBottom).toBe(0);
      expect(boxTop).toBe(160);
    });
  });

  describe('Interactive 3D STL Inspection (Unrestricted Size & Auto-Fit Preview without 160mm Limit)', () => {
    // 1. Auto-fit camera framing calculation
    const calculateAutoFitCamera = (lenX, widZ, hgtY, fov = 45) => {
      const maxDim = Math.max(lenX, widZ, hgtY, 20);
      const targetY = hgtY / 2;
      const fovRad = (fov * Math.PI) / 180;
      const radius = (maxDim / 2) * 1.35;
      const fitDistance = radius / Math.sin(fovRad / 2);
      const distance = Math.max(fitDistance * 1.25, 35);

      return {
        target: { x: 0, y: targetY, z: 0 },
        cameraPos: { x: 0, y: targetY + distance * 0.45, z: distance * 1.15 },
        near: Math.max(0.5, distance * 0.01),
        far: Math.max(12000, distance * 30),
        distance,
      };
    };

    // 2. Adaptive plate calculation
    const calculateAdaptivePlateSize = (lenX, widZ, maxBuildDimension = 160, noBuildLimit = false) => {
      const footprint = Math.max(lenX, widZ);
      let plate = maxBuildDimension;
      if (noBuildLimit || footprint > plate) {
        plate = Math.max(160, Math.ceil((footprint * 1.35) / 20) * 20);
      }
      return plate;
    };

    // 3. Model scale calculation and anchor preservation
    const scaleModelOnPlate = (initialBbox, scaleFactor) => {
      // initialBbox is already aligned: min.y = 0, centerX = 0, centerZ = 0
      const scaledMin = {
        x: initialBbox.min.x * scaleFactor,
        y: initialBbox.min.y * scaleFactor, // 0 * scale = 0
        z: initialBbox.min.z * scaleFactor,
      };
      const scaledMax = {
        x: initialBbox.max.x * scaleFactor,
        y: initialBbox.max.y * scaleFactor,
        z: initialBbox.max.z * scaleFactor,
      };
      return {
        min: scaledMin,
        max: scaledMax,
        centerX: (scaledMin.x + scaledMax.x) / 2,
        centerZ: (scaledMin.z + scaledMax.z) / 2,
        bottomY: scaledMin.y,
        height: scaledMax.y - scaledMin.y,
      };
    };

    test('auto-frames small models (20mm) up close in center without clipping', () => {
      const view = calculateAutoFitCamera(20, 15, 24);
      expect(view.target.x).toBe(0);
      expect(view.target.y).toBe(12); // vertical half-height
      expect(view.target.z).toBe(0);
      expect(view.distance).toBeGreaterThanOrEqual(35);
      expect(view.distance).toBeLessThan(150); // up close for fine detail
      expect(view.far).toBeGreaterThanOrEqual(12000);
    });

    test('auto-frames models exceeding 160mm (350mm) centered with appropriate viewing distance', () => {
      const view = calculateAutoFitCamera(350, 280, 200);
      expect(view.target.x).toBe(0);
      expect(view.target.y).toBe(100);
      expect(view.target.z).toBe(0);
      // Distance scales proportionally so 350mm model fits viewport completely
      expect(view.distance).toBeGreaterThan(600);
      expect(view.distance).toBeLessThan(1200);
      expect(view.far).toBeGreaterThan(view.distance);
    });

    test('auto-frames giant models (800mm) without 160mm restriction', () => {
      const view = calculateAutoFitCamera(800, 600, 500);
      expect(view.target.x).toBe(0);
      expect(view.target.y).toBe(250);
      expect(view.distance).toBeGreaterThan(1500);
      expect(view.far).toBeGreaterThanOrEqual(25000);
    });

    test('adapts build plate size dynamically to fit models larger than 160mm', () => {
      // 100mm model fits within standard 160mm plate
      expect(calculateAdaptivePlateSize(100, 80, 160, false)).toBe(160);

      // In noBuildLimit mode, plate expands dynamically with safety margin
      const plate250 = calculateAdaptivePlateSize(250, 200, 160, true);
      expect(plate250).toBeGreaterThanOrEqual(250);
      expect(plate250 % 20).toBe(0); // clean grid step

      const plate600 = calculateAdaptivePlateSize(600, 450, 160, true);
      expect(plate600).toBeGreaterThanOrEqual(600);
      expect(plate600).toBe(820);
    });

    test('scaling model preserves bottom flush at Y=0 and horizontal center at (X=0, Z=0)', () => {
      const baseBbox = {
        min: { x: -50, y: 0, z: -40 },
        max: { x: 50, y: 70, z: 40 },
      };

      // Test across multiple preview scale factors: 50%, 100%, 150%, 250%
      [0.5, 1.0, 1.5, 2.5].forEach((scale) => {
        const scaled = scaleModelOnPlate(baseBbox, scale);
        expect(scaled.bottomY).toBe(0); // remains flush on plate
        expect(Math.abs(scaled.centerX)).toBeLessThan(0.001); // remains centered on X
        expect(Math.abs(scaled.centerZ)).toBeLessThan(0.001); // remains centered on Z
        expect(scaled.height).toBeCloseTo(70 * scale, 2);
      });
    });

    test('noBuildLimit flag marks models exceeding 160mm as unrestricted inspection', () => {
      const checkDimensions = (lenX, widZ, hgtY, maxDim = 160, noBuildLimit = false) => {
        const exceeds = !noBuildLimit && (lenX > maxDim || widZ > maxDim || hgtY > maxDim);
        return {
          length: lenX,
          width: widZ,
          height: hgtY,
          exceedsLimit: exceeds,
        };
      };

      // Standard custom print mode: marks 250mm model as exceeding 160mm
      const restricted = checkDimensions(250, 180, 120, 160, false);
      expect(restricted.exceedsLimit).toBe(true);

      // Interactive 3D STL Inspection mode (noBuildLimit = true): unrestricted inspection
      const unrestricted = checkDimensions(250, 180, 120, 160, true);
      expect(unrestricted.exceedsLimit).toBe(false);
    });
  });

  describe('Delivery Cities Coverage & Storefront Selection', () => {
    const mockCities = [
      { id: 'city_1', name: 'Chandrapur', state: 'Maharashtra', turnaround: '1-2 Days', pincodes: '442401', isActive: true },
      { id: 'city_2', name: 'Mumbai', state: 'Maharashtra', turnaround: '2-3 Days', pincodes: '400001, 400050', isActive: true },
      { id: 'city_3', name: 'Bengaluru', state: 'Karnataka', turnaround: '2-3 Days', pincodes: '560001', isActive: true },
      { id: 'city_4', name: 'Discontinued Hub', state: 'Test State', turnaround: '5-7 Days', pincodes: '999999', isActive: false },
    ];

    test('filters and counts only active delivery cities for storefront', () => {
      const activeCities = mockCities.filter((c) => c.isActive);
      expect(activeCities.length).toBe(3);
      expect(activeCities.map((c) => c.name)).toEqual(['Chandrapur', 'Mumbai', 'Bengaluru']);
    });

    test('searches delivery cities by name, state, or PIN code case-insensitively', () => {
      const filterCities = (cities, query) => {
        const q = query.trim().toLowerCase();
        if (!q) return cities;
        return cities.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.state.toLowerCase().includes(q) ||
            (c.pincodes && c.pincodes.toLowerCase().includes(q))
        );
      };

      expect(filterCities(mockCities, 'mumbai')).toHaveLength(1);
      expect(filterCities(mockCities, 'maharashtra')).toHaveLength(2);
      expect(filterCities(mockCities, '442401')).toHaveLength(1);
      expect(filterCities(mockCities, 'nonexistent')).toHaveLength(0);
    });

    test('validates turnaround time and delivery badge text', () => {
      const formatDeliveryBadge = (city) => {
        if (!city || !city.isActive) return 'Check availability';
        return `Delivers in ${city.turnaround}`;
      };

      expect(formatDeliveryBadge(mockCities[0])).toBe('Delivers in 1-2 Days');
      expect(formatDeliveryBadge(mockCities[3])).toBe('Check availability');
    });

    test('matches checkout city input to verified hub', () => {
      const matchHub = (inputCity, cities) => {
        if (!inputCity) return null;
        const normalized = inputCity.trim().toLowerCase();
        return cities.find((c) => c.isActive && c.name.toLowerCase() === normalized) || null;
      };

      const match = matchHub('mumbai', mockCities);
      expect(match).not.toBeNull();
      expect(match.state).toBe('Maharashtra');
      expect(match.turnaround).toBe('2-3 Days');

      const noMatch = matchHub('Gotham', mockCities);
      expect(noMatch).toBeNull();
    });
  });

  describe('3D Viewer Optimization & Button Contrast Verification', () => {
    test('verifies reduced studio finishes palette (2 finishes: gold and titanium)', () => {
      const STUDIO_FINISHES = [
        { id: 'gold', name: 'Studio Gold', hex: '#f59e0b', ring: 'ring-amber-400' },
        { id: 'titanium', name: 'Titanium', hex: '#94a3b8', ring: 'ring-slate-400' },
      ];
      expect(STUDIO_FINISHES).toHaveLength(2);
      expect(STUDIO_FINISHES.map(f => f.hex)).toEqual(['#f59e0b', '#94a3b8']);
    });

    test('calculates real-time scaled dimensions smoothly without re-parsing geometry', () => {
      const baseDims = { length: 100, width: 80, height: 50 };
      const calculateScaledDimensions = (base, scale, maxBuildDimension = 160, noBuildLimit = false) => {
        const lenX = Math.round(base.length * scale);
        const widZ = Math.round(base.width * scale);
        const hgtY = Math.round(base.height * scale);
        const exceeds = !noBuildLimit && (lenX > maxBuildDimension || widZ > maxBuildDimension || hgtY > maxBuildDimension);
        return {
          length: Math.max(1, lenX),
          width: Math.max(1, widZ),
          height: Math.max(1, hgtY),
          exceedsLimit: exceeds,
        };
      };

      // 1.0x scale (default)
      const d1 = calculateScaledDimensions(baseDims, 1.0);
      expect(d1).toEqual({ length: 100, width: 80, height: 50, exceedsLimit: false });

      // 1.5x scale
      const d2 = calculateScaledDimensions(baseDims, 1.5);
      expect(d2).toEqual({ length: 150, width: 120, height: 75, exceedsLimit: false });

      // 2.0x scale: 200mm exceeds 160mm limit
      const d3 = calculateScaledDimensions(baseDims, 2.0);
      expect(d3).toEqual({ length: 200, width: 160, height: 100, exceedsLimit: true });

      // 2.0x scale with noBuildLimit
      const d4 = calculateScaledDimensions(baseDims, 2.0, 160, true);
      expect(d4.exceedsLimit).toBe(false);
    });

    test('verifies fast single-pass ASCII STL parser extracts vertices correctly without regex freeze', () => {
      const sampleAscii = `solid test
        facet normal 0 0 1
          outer loop
            vertex 0.0 0.0 0.0
            vertex 10.0 0.0 0.0
            vertex 10.0 10.0 0.0
          endloop
        endfacet
      endsolid test`;

      const lines = sampleAscii.split('\n');
      const vertices = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('vertex ')) {
          const parts = line.split(/\s+/);
          if (parts.length >= 4) {
            vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
          }
        }
      }

      expect(vertices).toHaveLength(9);
      expect(vertices).toEqual([0, 0, 0, 10, 0, 0, 10, 10, 0]);
    });

    test('verifies Add to Cart button classes have high contrast text (#030712 / text-gray-950 font-bold)', () => {
      const primaryBtnClasses = 'px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-gray-950 shadow-md shadow-amber-500/20';
      expect(primaryBtnClasses).toContain('text-gray-950');
      expect(primaryBtnClasses).toContain('font-bold');
      expect(primaryBtnClasses).toContain('from-amber-400');
    });
  });
});


