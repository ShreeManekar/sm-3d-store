import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth, User } from '../context/AuthContext';
import StlViewer from '../components/StlViewer';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  dimensions: string;
  dimensionsObj?: { length: number; width: number; height: number };
  material: string;
  colors: string[];
  price: number;
  stock: number;
  lowStockThreshold?: number;
  image: string;
  images?: string[];
  featured?: boolean;
  stlUrl?: string;
  modelName?: string;
}

export interface CustomOrder {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  description: string;
  dimensions: { length: number; width: number; height: number };
  exceedsLimit?: boolean;
  disassembled?: boolean;
  partsCount?: number;
  connectionMethod?: string;
  fileName?: string;
  fileUrl?: string;
  desiredMaterial: string;
  desiredColor: string;
  infillDensity: string;
  status: string;
  quotePrice: number | null;
  adminNotes: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
}

export interface CustomerOrder {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  shippingAddress: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentId: string;
  upiTransactionId?: string;
  paymentScreenshotUrl?: string;
  accountTransferDetails?: any;
  fulfillmentStatus: string;
  orderNotes?: string;
  createdAt: string;
}

export interface TechSpecs {
  buildVolume?: string;
  layerHeight?: string;
  materials?: string;
  nozzleSize?: string;
  printSpeed?: string;
  notes?: string;
}

export interface StoreSettings {
  storeName?: string;
  storeTagline?: string;
  maxPrintDimension?: number;
  shippingFee?: number;
  freeShippingThreshold?: number;
  whatsappNumber?: string;
  supportEmail?: string;
  currency?: string;
  taxRate?: number;
  upiId?: string;
  upiQrImage?: string;
  razorpayId?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountHolderName?: string;
  techSpecs?: TechSpecs;
  availableFilaments?: string[];
  deliveryCities?: DeliveryCity[];
}

export interface DeliveryCity {
  id: string;
  name: string;
  state: string;
  estimatedDays?: string;
  active: boolean;
  pincodes?: string;
}

type TabType = 'overview' | 'products' | 'custom' | 'orders' | 'users' | 'payments' | 'settings' | 'delivery' | 'rfqs' | 'reviews' | 'finances';

export const Admin: React.FC = () => {
  const { currentUser, isAdmin, adminLogin, logout, getAdminHeaders } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['overview', 'products', 'custom', 'orders', 'users', 'payments', 'settings', 'delivery', 'rfqs', 'reviews', 'finances'].includes(tabParam)) {
      return tabParam;
    }
    return 'overview';
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Login States if not authenticated (empty by default for security)
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Data collections
  const [products, setProducts] = useState<Product[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({});
  const [deliveryCities, setDeliveryCities] = useState<DeliveryCity[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [rfqSearch, setRfqSearch] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [isSavingLocked, setIsSavingLocked] = useState(false);

  // Delivery City Management States
  const [deliveryCitySearch, setDeliveryCitySearch] = useState('');
  const [deliveryCityModalOpen, setDeliveryCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<DeliveryCity | null>(null);
  const [cityForm, setCityForm] = useState({
    name: '',
    state: '',
    estimatedDays: '2-4 Days',
    active: true,
    pincodes: ''
  });
  const [citySubmitting, setCitySubmitting] = useState(false);

  // Modals & Active Edit Entities
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Dimension helpers for editingProduct
  const [editLength, setEditLength] = useState<number>(100);
  const [editWidth, setEditWidth] = useState<number>(100);
  const [editHeight, setEditHeight] = useState<number>(100);

  // Uploading and filament states
  const [includeModel, setIncludeModel] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imgUploadProgress, setImgUploadProgress] = useState<number | null>(null);
  const [uploadingStl, setUploadingStl] = useState(false);
  const [stlUploadProgress, setStlUploadProgress] = useState<number | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [showAddFilamentModal, setShowAddFilamentModal] = useState(false);
  const [newFilamentName, setNewFilamentName] = useState('');
  const [screenshotModalUrl, setScreenshotModalUrl] = useState<string | null>(null);

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quotingOrder, setQuotingOrder] = useState<CustomOrder | null>(null);
  const [quotePriceInput, setQuotePriceInput] = useState('');
  const [quoteNotesInput, setQuoteNotesInput] = useState('');

  const [stlModalUrl, setStlModalUrl] = useState<string | null>(null);

  // Search/Filters in Products
  const [productSearch, setProductSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const headers = getAdminHeaders();
    try {
      const [pRes, cRes, oRes, uRes, sRes, dRes, rfqRes, revRes, finRes] = await Promise.all([
        axios.get('/api/products').catch(() => ({ data: [] })),
        axios.get('/api/custom-orders', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/orders', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/users', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/settings').catch(() => ({ data: {} })),
        axios.get('/api/delivery-cities').catch(() => ({ data: { cities: [] } })),
        axios.get('/api/rfqs', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/reviews', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/admin/financial-summary', { headers }).catch(() => ({ data: null })),
      ]);

      setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setCustomOrders(Array.isArray(cRes.data) ? cRes.data : []);
      setOrders(Array.isArray(oRes.data) ? oRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      const rawLoadedCities = Array.isArray(dRes.data?.cities) ? dRes.data.cities : (Array.isArray(dRes.data) ? dRes.data : []);
      const loadedCities = rawLoadedCities.map((c: any) => ({
        ...c,
        active: c.active !== false && c.isActive !== false,
        isActive: c.active !== false && c.isActive !== false,
      }));
      setDeliveryCities(loadedCities);
      const loadedSettings = sRes.data || {};
      loadedSettings.deliveryCities = loadedCities;
      setSettings(loadedSettings);
      setRfqs(Array.isArray(rfqRes.data) ? rfqRes.data : []);
      setReviews(Array.isArray(revRes.data) ? revRes.data : []);
      setFinancialSummary(finRes.data || null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [getAdminHeaders]);

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin, loadAllData]);

  // Sync activeTab and product edit modal with URL query parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['overview', 'products', 'custom', 'orders', 'users', 'payments', 'settings', 'delivery', 'rfqs', 'reviews', 'finances'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const prod = products.find((p) => p.id === editId);
      if (prod) {
        openEditProductModal(prod);
      }
    }
  }, [searchParams, products]);

  // Open Product Modal with parsed dimensions
  const openEditProductModal = (p: Partial<Product>) => {
    let l = 100, w = 100, h = 100;
    if (p.dimensionsObj) {
      l = Number(p.dimensionsObj.length) || 100;
      w = Number(p.dimensionsObj.width) || 100;
      h = Number(p.dimensionsObj.height) || 100;
    } else if (p.dimensions) {
      const match = p.dimensions.match(/(\d+)/g);
      if (match && match.length >= 2) {
        l = parseInt(match[0]) || 100;
        w = parseInt(match[1]) || 100;
        h = match[2] ? parseInt(match[2]) : 100;
      }
    }
    setEditLength(l);
    setEditWidth(w);
    setEditHeight(h);
    setEditingProduct({
      ...p,
      dimensionsObj: { length: l, width: w, height: h },
      dimensions: `${l} x ${w} x ${h} mm`,
      material: p.material || 'PLA',
    });
    setIncludeModel(Boolean(p.stlUrl && p.stlUrl !== 'NA' && p.stlUrl.trim() !== ''));
    setProductModalOpen(true);
  };

  // Dimensions number-only handler
  const handleDimChange = (dim: 'length' | 'width' | 'height', val: number) => {
    const num = Math.max(1, isNaN(val) ? 1 : val);
    let l = editLength, w = editWidth, h = editHeight;
    if (dim === 'length') { l = num; setEditLength(num); }
    if (dim === 'width') { w = num; setEditWidth(num); }
    if (dim === 'height') { h = num; setEditHeight(num); }
    setEditingProduct((prev) =>
      prev
        ? {
            ...prev,
            dimensionsObj: { length: l, width: w, height: h },
            dimensions: `${l} x ${w} x ${h} mm`,
          }
        : null
    );
  };

  // Image & 3D Model Upload Handler (accepts images, .stl, .3mf, .obj, .step, .stp up to 200MB)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      alert('The selected file is empty (0 bytes).');
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    if (file.size > MAX_SIZE) {
      alert(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 200MB limit. Please choose a file under 200MB.`);
      e.target.value = '';
      return;
    }

    const lower = file.name.toLowerCase();
    const is3d = lower.endsWith('.stl') || lower.endsWith('.3mf') || lower.endsWith('.obj') || lower.endsWith('.step') || lower.endsWith('.stp');
    if (is3d) setIncludeModel(true);
    setUploadingImage(true);
    setImgUploadProgress(0);

    const reader = new FileReader();
    reader.onerror = () => {
      alert('Failed to read image file from disk.');
      setUploadingImage(false);
      setImgUploadProgress(null);
    };
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await axios.post('/api/upload', {
          filename: file.name,
          fileData: base64,
        }, {
          timeout: 300000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setImgUploadProgress(percent);
            }
          }
        });
        const url = res.data.fileUrl;
        setEditingProduct((prev) => {
          if (!prev) return null;
          if (is3d) {
            setIncludeModel(true);
            return {
              ...prev,
              stlUrl: url,
              image: prev.image || url,
            };
          }
          return {
            ...prev,
            image: url,
            images: [url, ...(prev.images || []).filter((u) => u !== url)],
          };
        });
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        showToast(is3d ? `3D Model uploaded: ${file.name} (${sizeMb} MB)` : `Image uploaded: ${file.name}`);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to upload file');
      } finally {
        setUploadingImage(false);
        setImgUploadProgress(null);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // 3D Model (.stl, .3mf, .obj, .step, .stp up to 200MB) Upload Handler
  const handleStlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      alert('The selected 3D model file is empty (0 bytes).');
      e.target.value = '';
      return;
    }

    const lower = file.name.toLowerCase();
    const valid3d = ['.stl', '.3mf', '.obj', '.step', '.stp'];
    const hasValidExt = valid3d.some((v) => lower.endsWith(v));
    if (!hasValidExt) {
      alert('File format restricted! Only .stl, .3mf, .obj, and STEP 3D model files are accepted.');
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    if (file.size > MAX_SIZE) {
      alert(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 200MB limit. Please upload a file under 200MB.`);
      e.target.value = '';
      return;
    }

    setIncludeModel(true);
    setUploadingStl(true);
    setStlUploadProgress(0);
    const reader = new FileReader();
    reader.onerror = () => {
      alert('Failed to read 3D model file from disk.');
      setUploadingStl(false);
      setStlUploadProgress(null);
    };
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await axios.post('/api/upload', {
          filename: file.name,
          fileData: base64,
        }, {
          timeout: 300000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setStlUploadProgress(percent);
            }
          }
        });
        const url = res.data.fileUrl;
        setIncludeModel(true);
        setEditingProduct((prev) =>
          prev
            ? {
                ...prev,
                stlUrl: url,
              }
            : null
        );
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        showToast(`3D Model uploaded successfully: ${file.name} (${sizeMb} MB)`);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to upload 3D model');
      } finally {
        setUploadingStl(false);
        setStlUploadProgress(null);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // UPI QR Code Image Upload Handler (any image format up to 200MB)
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      alert('The selected QR image file is empty (0 bytes).');
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    if (file.size > MAX_SIZE) {
      alert(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 200MB limit. Please upload a file under 200MB.`);
      e.target.value = '';
      return;
    }

    setUploadingQr(true);
    const reader = new FileReader();
    reader.onerror = () => {
      alert('Failed to read QR image file from disk.');
      setUploadingQr(false);
    };
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await axios.post('/api/upload', {
          filename: file.name,
          fileData: base64,
        }, {
          timeout: 300000,
        });
        const url = res.data.fileUrl;
        setSettings((prev) => ({ ...prev, upiQrImage: url }));
        showToast('UPI QR scanner image uploaded');
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to upload QR scanner');
      } finally {
        setUploadingQr(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Add new filament to settings
  const handleAddFilament = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newFilamentName.trim();
    if (!name) return;
    const existing = settings.availableFilaments || ['PLA', 'PETG', 'ABS', 'CF-PETG', 'TPU', 'Marble PLA', 'Silk Rainbow PLA', 'Nylon', 'Resin'];
    if (existing.map((f) => f.toLowerCase()).includes(name.toLowerCase())) {
      setEditingProduct((prev) => (prev ? { ...prev, material: name } : null));
      setShowAddFilamentModal(false);
      setNewFilamentName('');
      return;
    }
    const updated = [...existing, name];
    const headers = getAdminHeaders();
    try {
      await axios.put('/api/settings', { ...settings, availableFilaments: updated }, { headers });
      setSettings((prev) => ({ ...prev, availableFilaments: updated }));
      setEditingProduct((prev) => (prev ? { ...prev, material: name } : null));
      setShowAddFilamentModal(false);
      setNewFilamentName('');
      showToast(`Added filament: ${name}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save filament to settings');
    }
  };

  // Save payment credentials & bank details
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAdminHeaders();
    try {
      const payload = { ...settings, deliveryCities };
      await axios.put('/api/settings', payload, { headers });
      setSettings(payload);
      showToast('Payment credentials and banking details saved successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save payment settings');
    }
  };

  // Toggle Order Payment Status
  const handleTogglePaymentStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Paid' ? 'Pending Verification' : 'Paid';
    const headers = getAdminHeaders();
    try {
      await axios.put(`/api/orders/${orderId}/status`, { paymentStatus: nextStatus }, { headers });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: nextStatus } : o)));
      showToast(`Order ${orderId} payment status updated to ${nextStatus}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update payment status');
    }
  };

  // Export payment statements to Excel
  const handleExportPaymentsToExcel = () => {
    if (orders.length === 0) {
      alert('No payment statements to export.');
      return;
    }
    const rows = orders.map((ord) => ({
      'Order ID': ord.id,
      'Date & Time': ord.createdAt ? new Date(ord.createdAt).toLocaleString() : '',
      'Customer Name': ord.userName,
      'Email': ord.userEmail,
      'Phone': ord.userPhone,
      'Amount (INR)': ord.total,
      'Payment Method': ord.paymentMethod,
      'UPI Transaction ID': ord.upiTransactionId || 'N/A',
      'Payment Status': ord.paymentStatus,
      'Payment Screenshot Proof': ord.paymentScreenshotUrl ? `${window.location.origin}${ord.paymentScreenshotUrl}` : 'None',
      'Fulfillment Status': ord.fulfillmentStatus,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment_Statements');
    XLSX.writeFile(workbook, `SM3D_Payment_Statements_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Payment statements exported to Excel!');
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
    const totalOrdersCount = orders.length;
    const pendingQuotesCount = customOrders.filter(
      (c) => c.status === 'Requested' || !c.quotePrice
    ).length;
    const registeredUsersCount = users.length;
    return {
      totalRevenue,
      totalOrdersCount,
      pendingQuotesCount,
      registeredUsersCount,
    };
  }, [orders, customOrders, users]);

  // Handle Admin Login submission if unauthenticated
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await adminLogin(adminEmailInput, adminPasswordInput);
      showToast('Admin authenticated successfully');
    } catch (err: any) {
      setLoginError(err.response?.data?.error || err.message || 'Admin authentication failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const headers = getAdminHeaders();

    const productPayload = {
      ...editingProduct,
      stlUrl: includeModel ? (editingProduct.stlUrl || '').trim() : '',
      modelName: includeModel ? (editingProduct.modelName || '').trim() : '',
    };

    try {
      if (editingProduct.id) {
        // Edit existing product
        await axios.put(`/api/products/${editingProduct.id}`, productPayload, { headers });
        showToast('Product updated successfully');
      } else {
        // Create new product
        await axios.post('/api/products', productPayload, { headers });
        showToast('New product created successfully');
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product listing?')) return;
    const headers = getAdminHeaders();
    try {
      await axios.delete(`/api/products/${id}`, { headers });
      showToast('Product deleted');
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!window.confirm('Are you sure you want to delete ALL products from the catalog? This action cannot be undone.')) return;
    const headers = getAdminHeaders();
    try {
      await axios.delete('/api/products', { headers });
      setProducts([]);
      showToast('All products deleted successfully');
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete all products');
    }
  };

  // Custom Order Quote submission
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotingOrder) return;
    const headers = getAdminHeaders();
    try {
      await axios.put(
        `/api/custom-orders/${quotingOrder.id}/quote`,
        {
          quotePrice: parseFloat(quotePriceInput) || 0,
          adminNotes: quoteNotesInput,
          status: 'Quoted',
        },
        { headers }
      );
      showToast(`Quote sent for order ${quotingOrder.id}`);
      setQuoteModalOpen(false);
      setQuotingOrder(null);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update quote');
    }
  };

  const handleUpdateCustomStatus = async (id: string, status: string) => {
    const headers = getAdminHeaders();
    try {
      await axios.put(`/api/custom-orders/${id}/status`, { status }, { headers });
      showToast(`Custom order status updated to ${status}`);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update custom order status');
    }
  };

  // Customer Order status update
  const handleUpdateOrderStatus = async (id: string, fulfillmentStatus: string) => {
    const headers = getAdminHeaders();
    try {
      await axios.put(`/api/orders/${id}/status`, { fulfillmentStatus }, { headers });
      showToast(`Order status updated to ${fulfillmentStatus}`);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update order status');
    }
  };

  // Payment Options Helpers & Inline Handler for [Paid, Not Paid, COD, WhatsApp, Bank Account, UPI]
  const getOrderPaymentOption = (ord: CustomerOrder): string => {
    const status = (ord.paymentStatus || '').trim().toLowerCase();
    const method = (ord.paymentMethod || '').trim().toLowerCase();

    // 1. Direct status check
    if (status === 'cod') return 'COD';
    if (status === 'whatsapp') return 'WhatsApp';
    if (status === 'bank account' || status === 'account transfer') return 'Bank Account';
    if (status === 'upi') return 'UPI';
    if (status === 'not paid' || status === 'unpaid' || status === 'pending') return 'Not Paid';
    if (status === 'paid' || status === 'completed') {
      if (method.includes('cod')) return 'COD';
      return 'Paid';
    }

    // 2. Fallback to paymentMethod
    if (method.includes('cod')) return 'COD';
    if (method.includes('whatsapp')) return 'WhatsApp';
    if (method.includes('bank') || method.includes('account')) return 'Bank Account';
    if (method.includes('upi')) return 'UPI';
    if (method.includes('not paid') || method.includes('unpaid') || method.includes('pending')) return 'Not Paid';
    if (method.includes('paid')) return 'Paid';

    return 'Paid';
  };

  const getPaymentBadge = (opt: string) => {
    const normalized = (opt || '').trim().toLowerCase();
    switch (normalized) {
      case 'paid':
        return {
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
          icon: '✓',
        };
      case 'not paid':
      case 'unpaid':
      case 'pending':
        return {
          badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
          icon: '✕',
        };
      case 'cod':
        return {
          badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
          icon: '📦',
        };
      case 'whatsapp':
        return {
          badgeClass: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30',
          icon: '💬',
        };
      case 'bank account':
      case 'upi':
      default:
        return {
          badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
          icon: '⚡',
        };
    }
  };

  const handleUpdateOrderPayment = async (id: string, paymentValue: string) => {
    const headers = getAdminHeaders();
    let paymentStatus = paymentValue;
    let paymentMethod = paymentValue;

    const existing = orders.find((o) => o.id === id);
    if (paymentValue === 'Paid') {
      paymentStatus = 'Paid';
      paymentMethod = existing?.paymentMethod || 'Paid';
    } else if (paymentValue === 'Not Paid') {
      paymentStatus = 'Not Paid';
      paymentMethod = existing?.paymentMethod || 'Not Paid';
    } else if (paymentValue === 'COD') {
      paymentStatus = 'Not Paid';
      paymentMethod = 'COD';
    } else {
      // WhatsApp, Bank Account, UPI
      paymentStatus = (existing?.paymentStatus && existing.paymentStatus.toLowerCase().includes('not')) ? 'Not Paid' : 'Paid';
      paymentMethod = paymentValue;
    }

    try {
      await axios.put(`/api/orders/${id}/status`, { paymentStatus, paymentMethod }, { headers });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paymentStatus, paymentMethod } : o)));
      showToast(`Payment updated to ${paymentValue} for order ${id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update order payment');
    }
  };

  // Customer Store Order deletion
  const handleDeleteOrder = async (id: string, customerName?: string) => {
    if (!window.confirm(`Are you sure you want to delete order ${id}${customerName ? ` for ${customerName}` : ''}? This action cannot be undone.`)) return;
    const headers = getAdminHeaders();
    try {
      await axios.delete(`/api/orders/${id}`, { headers });
      setOrders(prev => prev.filter(o => o.id !== id));
      showToast(`Order ${id} deleted successfully`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete customer order');
    }
  };

  // Custom Print Order deletion
  const handleDeleteCustomOrder = async (id: string, customerName?: string) => {
    if (!window.confirm(`Are you sure you want to delete custom print quote ${id}${customerName ? ` for ${customerName}` : ''}? This action cannot be undone.`)) return;
    const headers = getAdminHeaders();
    try {
      await axios.delete(`/api/custom-orders/${id}`, { headers });
      setCustomOrders(prev => prev.filter(c => c.id !== id));
      showToast(`Custom order ${id} deleted successfully`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete custom order');
    }
  };

  // Customer Account deletion
  const handleDeleteUser = async (id: string, userName?: string) => {
    if (!window.confirm(`Are you sure you want to delete customer account ${userName || id}? This action cannot be undone.`)) return;
    const headers = getAdminHeaders();
    try {
      await axios.delete(`/api/users/${id}`, { headers });
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast(`Customer account deleted successfully`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete customer account');
    }
  };

  // Export Orders to Excel (xlsx)
  const handleExportOrdersToExcel = () => {
    if (orders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const rows = orders.map((ord) => ({
      'Order ID': ord.id,
      'Date': ord.createdAt ? new Date(ord.createdAt).toLocaleString() : '',
      'Customer Name': ord.userName,
      'Email': ord.userEmail,
      'Phone': ord.userPhone,
      'Items': ord.items?.map((i) => `${i.name} (x${i.quantity})`).join('; ') || '',
      'Subtotal (INR)': ord.subtotal,
      'Shipping Fee (INR)': ord.shippingFee,
      'Total Amount (INR)': ord.total,
      'Payment Status': ord.paymentStatus,
      'Payment Method': ord.paymentMethod,
      'Fulfillment Status': ord.fulfillmentStatus,
      'Street Address': ord.shippingAddress?.street || '',
      'City': ord.shippingAddress?.city || '',
      'State': ord.shippingAddress?.state || '',
      'Pincode': ord.shippingAddress?.pincode || '',
      'Order Notes': ord.orderNotes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `SM3D_Orders_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Orders exported to Excel successfully!');
  };

  // Export Products Catalog to Excel
  const handleExportProductsToExcel = () => {
    if (products.length === 0) {
      alert('No products to export.');
      return;
    }
    const rows = products.map((p) => ({
      'Product ID': p.id,
      'SKU': p.sku,
      'Name': p.name,
      'Category': p.category,
      'Price (INR)': p.price,
      'Stock': p.stock,
      'Dimensions': p.dimensions,
      'Material': p.material,
      'Description': p.description,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, `SM3D_Products_Catalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Products catalog exported to Excel!');
  };

  // Export Custom Print Requests to Excel
  const handleExportCustomOrdersToExcel = () => {
    if (customOrders.length === 0) {
      alert('No custom quotes to export.');
      return;
    }
    const rows = customOrders.map((c) => ({
      'Request ID': c.id,
      'Customer Name': c.userName,
      'Email': c.userEmail,
      'Phone': c.userPhone,
      'Material': c.desiredMaterial,
      'Color': c.desiredColor,
      'Infill': c.infillDensity,
      'Length (mm)': c.dimensions?.length,
      'Width (mm)': c.dimensions?.width,
      'Height (mm)': c.dimensions?.height,
      'Status': c.status,
      'Quote Price (INR)': c.quotePrice || 'Pending',
      'Created Date': c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Custom_Quotes');
    XLSX.writeFile(workbook, `SM3D_Custom_Quotes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Custom quotes exported to Excel!');
  };

  // Export Complete Master Workbook with all tables
  const handleExportAllToExcel = () => {
    const workbook = XLSX.utils.book_new();
    if (orders.length > 0) {
      const orderRows = orders.map((ord) => ({
        'Order ID': ord.id,
        'Date': ord.createdAt ? new Date(ord.createdAt).toLocaleString() : '',
        'Customer Name': ord.userName,
        'Email': ord.userEmail,
        'Phone': ord.userPhone,
        'Total (INR)': ord.total,
        'Payment Status': ord.paymentStatus,
        'Fulfillment Status': ord.fulfillmentStatus,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(orderRows), 'Orders');
    }
    if (products.length > 0) {
      const prodRows = products.map((p) => ({
        'SKU': p.sku,
        'Name': p.name,
        'Category': p.category,
        'Price (INR)': p.price,
        'Stock': p.stock,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(prodRows), 'Products');
    }
    if (customOrders.length > 0) {
      const customRows = customOrders.map((c) => ({
        'Request ID': c.id,
        'Customer': c.userName,
        'Material': c.desiredMaterial,
        'Status': c.status,
        'Quote (INR)': c.quotePrice || 'Pending',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(customRows), 'Custom_Quotes');
    }
    XLSX.writeFile(workbook, `SM3D_Master_Dataset_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Master dataset exported to Excel!');
  };

  // Save & Lock Changes permanently to backend
  const handleSaveAndLockChanges = async () => {
    setIsSavingLocked(true);
    const headers = getAdminHeaders();
    try {
      const payload = {
        ...settings,
        deliveryCities: deliveryCities,
      };
      await axios.put('/api/settings', payload, { headers });
      setSettings(payload);
      showToast('All changes & delivery settings saved & locked permanently!');
    } catch (err: any) {
      console.error('Failed to save & lock changes:', err);
      showToast(err.response?.data?.error || 'Failed to lock changes to server.');
    } finally {
      setIsSavingLocked(false);
    }
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAdminHeaders();
    try {
      const payload = { ...settings, deliveryCities };
      await axios.put('/api/settings', payload, { headers });
      setSettings(payload);
      showToast('Settings saved successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save settings');
    }
  };

  // IF NOT AUTHENTICATED AS ADMIN: Show Admin Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-transparent text-inherit flex flex-col justify-center items-center">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-purple-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Private Admin Portal</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Protected area. Please enter your administrator credentials to access store controls.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Email</label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="Enter administrator email address"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Master Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="Enter master admin password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2"
            >
              {loginLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Authenticate Admin'}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link to="/" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">
              ← Return to Store Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Delivery City Management Handlers
  const handleOpenAddCityModal = () => {
    setEditingCity(null);
    setCityForm({
      name: '',
      state: 'Maharashtra',
      estimatedDays: '2-3 Days',
      active: true,
      pincodes: ''
    });
    setDeliveryCityModalOpen(true);
  };

  const handleOpenEditCityModal = (city: DeliveryCity) => {
    setEditingCity(city);
    setCityForm({
      name: city.name,
      state: city.state || '',
      estimatedDays: city.estimatedDays || '2-4 Days',
      active: city.active !== false,
      pincodes: city.pincodes || ''
    });
    setDeliveryCityModalOpen(true);
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityForm.name.trim()) {
      showToast('Please specify a valid city name.');
      return;
    }
    setCitySubmitting(true);
    const headers = getAdminHeaders();
    try {
      if (editingCity) {
        const res = await axios.put(`/api/delivery-cities/${editingCity.id}`, cityForm, { headers });
        const updatedCity = {
          ...res.data.city,
          active: res.data.city.active !== false && (res.data.city as any).isActive !== false,
          isActive: res.data.city.active !== false && (res.data.city as any).isActive !== false,
        };
        const nextCities = deliveryCities.map((c) => (c.id === editingCity.id ? updatedCity : c));
        setDeliveryCities(nextCities);
        setSettings((prev) => ({ ...prev, deliveryCities: nextCities }));
        showToast(`City "${cityForm.name}" updated successfully!`);
      } else {
        const res = await axios.post('/api/delivery-cities', cityForm, { headers });
        const newCity = {
          ...res.data.city,
          active: res.data.city.active !== false && (res.data.city as any).isActive !== false,
          isActive: res.data.city.active !== false && (res.data.city as any).isActive !== false,
        };
        const nextCities = [...deliveryCities, newCity];
        setDeliveryCities(nextCities);
        setSettings((prev) => ({ ...prev, deliveryCities: nextCities }));
        showToast(`City "${cityForm.name}" added to delivery coverage!`);
      }
      setDeliveryCityModalOpen(false);
      setEditingCity(null);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save delivery city.');
    } finally {
      setCitySubmitting(false);
    }
  };

  const handleToggleCityActive = async (city: DeliveryCity) => {
    const headers = getAdminHeaders();
    const isCurrentlyActive = city.active !== false && (city as any).isActive !== false;
    const newStatus = !isCurrentlyActive;
    try {
      await axios.put(`/api/delivery-cities/${city.id}`, { active: newStatus, isActive: newStatus }, { headers });
      const nextCities = deliveryCities.map((c) =>
        c.id === city.id ? { ...c, active: newStatus, isActive: newStatus } : c
      );
      setDeliveryCities(nextCities);
      setSettings((prev) => ({ ...prev, deliveryCities: nextCities }));
      showToast(`${city.name} marked as ${newStatus ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update city status.');
    }
  };

  const handleDeleteCity = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the active delivery coverage network?`)) {
      return;
    }
    const headers = getAdminHeaders();
    try {
      await axios.delete(`/api/delivery-cities/${id}`, { headers });
      const nextCities = deliveryCities.filter((c) => c.id !== id);
      setDeliveryCities(nextCities);
      setSettings((prev) => ({ ...prev, deliveryCities: nextCities }));
      showToast(`City "${name}" removed from delivery coverage.`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to remove delivery city.');
    }
  };

  // Filter delivery cities
  const filteredDeliveryCities = deliveryCities.filter((c) => {
    const q = deliveryCitySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.state || '').toLowerCase().includes(q) ||
      (c.pincodes || '').toLowerCase().includes(q) ||
      (c.estimatedDays || '').toLowerCase().includes(q)
    );
  });

  // RFQ Management Handlers
  const handleUpdateRfqStatus = async (rfqId: string, nextStatus: string) => {
    const headers = getAdminHeaders();
    try {
      await axios.put(`/api/rfq/${rfqId}`, { status: nextStatus }, { headers });
      setRfqs((prev) => prev.map((r) => r.id === rfqId ? { ...r, status: nextStatus } : r));
      showToast(`RFQ ${rfqId} status updated to "${nextStatus}".`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update RFQ status.');
    }
  };

  const handleDeleteRfq = async (rfqId: string) => {
    if (!window.confirm(`Are you sure you want to delete inquiry "${rfqId}"?`)) return;
    const headers = getAdminHeaders();
    try {
      await axios.delete(`/api/rfq/${rfqId}`, { headers });
      setRfqs((prev) => prev.filter((r) => r.id !== rfqId));
      showToast(`RFQ ${rfqId} deleted successfully.`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete RFQ.');
    }
  };

  const handleExportRfqsXlsx = () => {
    if (rfqs.length === 0) {
      alert('No RFQ records available to export.');
      return;
    }
    const data = rfqs.map((r) => ({
      'RFQ ID': r.id,
      'Company Name': r.companyName || 'N/A',
      'Contact Name': r.contactName || '',
      'Email': r.email || '',
      'Phone': r.phone || '',
      'Quantity': r.quantity || 1,
      'Material': r.material || '',
      'Target Date': r.targetDate || '',
      'NDA Required': r.ndaRequired ? 'Yes' : 'No',
      'Status': r.status || 'Received',
      'Project Notes': r.projectNotes || '',
      'Created At': r.createdAt || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enterprise_RFQs');
    XLSX.writeFile(workbook, `SM3D_Enterprise_RFQs_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Exported Enterprise RFQs to Excel.');
  };

  // Reviews Moderation Handlers
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to remove this customer review?')) return;
    const headers = getAdminHeaders();
    try {
      await axios.delete(`/api/reviews/${reviewId}`, { headers });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast('Customer review removed successfully.');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete review.');
    }
  };

  // Financial Report Export
  const handleExportFinancesXlsx = () => {
    if (!orders || orders.length === 0) {
      alert('No order records available to export.');
      return;
    }
    const ordersData = orders.map((o) => ({
      'Order ID': o.id,
      'Customer': o.userName,
      'Email': o.userEmail,
      'Phone': o.userPhone,
      'Subtotal (INR)': o.subtotal,
      'Shipping Fee (INR)': o.shippingFee,
      'Total (INR)': o.total,
      'Payment Status': o.paymentStatus,
      'Payment Method': o.paymentMethod,
      'Transaction / Ref ID': o.upiTransactionId || o.paymentId || 'N/A',
      'Fulfillment Status': o.fulfillmentStatus,
      'City': o.shippingAddress?.city || '',
      'State': o.shippingAddress?.state || '',
      'Pincode': o.shippingAddress?.pincode || '',
      'Order Date': o.createdAt,
    }));
    const worksheet = XLSX.utils.json_to_sheet(ordersData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial_Ledger');
    XLSX.writeFile(workbook, `SM3D_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Exported Financial Statements to Excel.');
  };

  // Filter RFQs
  const filteredRfqs = rfqs.filter((r) => {
    const q = rfqSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.id || '').toLowerCase().includes(q) ||
      (r.companyName || '').toLowerCase().includes(q) ||
      (r.contactName || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.material || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    );
  });

  // Filter products by query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent text-inherit py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 border border-amber-500/40 text-amber-500 dark:text-amber-300 px-4 py-3 rounded-2xl shadow-2xl text-xs flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                ⚡
              </span>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">SM 3D Admin Control Center</h1>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Logged in as <span className="text-purple-600 dark:text-purple-400 font-semibold">{currentUser?.name}</span> ({currentUser?.email})
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveAndLockChanges}
              disabled={isSavingLocked}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              title="Save & Lock all current settings, modifications, and delivery network permanently"
            >
              <svg className={`w-4 h-4 ${isSavingLocked ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{isSavingLocked ? 'Saving Changes...' : '💾 Save & Lock Changes'}</span>
            </button>
            <button
              type="button"
              onClick={loadAllData}
              className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-xs flex items-center gap-1.5 shadow-sm"
              title="Refresh Data"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <Link
              to="/account"
              className="px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-xs shadow-sm"
            >
              My Profile
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition text-xs flex items-center gap-1"
            >
              Logout Admin
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
          {[
            { id: 'overview', label: 'Dashboard & Stats', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'products', label: 'Products Catalog', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { id: 'custom', label: 'Custom Print Quotes', icon: 'M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { id: 'orders', label: 'Customer Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
            { id: 'finances', label: 'Financial Statements', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'rfqs', label: 'Enterprise RFQs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'reviews', label: 'Customer Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
            { id: 'users', label: 'Users & Admins', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'payments', label: 'Payments & Banking', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
            { id: 'delivery', label: 'Delivery & City Coverage', icon: 'M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2' },
            { id: 'settings', label: 'Store & Machine Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setSearchParams({ tab: tab.id });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
              {tab.id === 'custom' && stats.pendingQuotesCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] flex items-center justify-center">
                  {stats.pendingQuotesCount}
                </span>
              )}
              {tab.id === 'rfqs' && rfqs.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center">
                  {rfqs.length}
                </span>
              )}
              {tab.id === 'reviews' && reviews.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] flex items-center justify-center">
                  {reviews.length}
                </span>
              )}
              {tab.id === 'delivery' && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-gray-950 font-extrabold text-[10px] flex items-center justify-center shadow">
                  {deliveryCities.filter(c => c.active !== false).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 5 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <span className="text-xl font-bold">₹</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Store Revenue</span>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">₹{stats.totalRevenue.toLocaleString()}</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Customer Orders Placed</span>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.totalOrdersCount}</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Custom Quotes Pending</span>
                  <div className="text-2xl font-extrabold text-amber-500">{stats.pendingQuotesCount}</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Registered Accounts</span>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.registeredUsersCount}</div>
                </div>
              </div>

              <div
                onClick={() => { setActiveTab('delivery'); setSearchParams({ tab: 'delivery' }); }}
                className="p-5 rounded-2xl bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-pointer hover:border-amber-500/50 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Delivery Coverage</span>
                  <div className="text-2xl font-extrabold text-amber-500 dark:text-amber-400">
                    {deliveryCities.filter(c => c.active !== false).length} <span className="text-xs font-semibold text-gray-500">Cities</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Orders Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-amber-500 dark:text-amber-400 hover:underline">
                    View All →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-gray-500 py-3 text-center">No orders recorded yet.</p>
                ) : (
                  orders.slice(0, 4).map((ord) => (
                    <div key={ord.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-amber-500 dark:text-amber-400 font-bold">{ord.id}</span>
                        <p className="text-gray-600 dark:text-gray-300 mt-0.5">{ord.userName} • {ord.items?.length || 0} items</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-gray-900 dark:text-white">₹{ord.total}</span>
                        <span className="block text-[10px] text-gray-500">{ord.fulfillmentStatus}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick System Tools */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Administrative Shortcuts</h3>
                <button
                  onClick={() => {
                    openEditProductModal({
                      sku: `SM3D-${Math.floor(100 + Math.random() * 900)}`,
                      name: '',
                      category: 'Display Models',
                      price: 499,
                      stock: 10,
                      dimensions: '100 x 100 x 100 mm',
                      colors: ['Pure White', 'Black'],
                      material: 'PLA',
                      stlUrl: '',
                    });
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 hover:bg-amber-500/20 transition text-xs font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create New Product Listing
                </button>
                <button
                  onClick={() => { setActiveTab('delivery'); setSearchParams({ tab: 'delivery' }); }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 hover:bg-amber-500/20 transition text-xs font-semibold flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2" /></svg>
                    <span>Delivery Cities Network</span>
                  </div>
                  <span className="font-bold text-[10px] bg-amber-500/20 text-amber-500 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    {deliveryCities.filter(c => c.active !== false).length} Active
                  </span>
                </button>
                <button
                  onClick={handleExportOrdersToExcel}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition text-xs font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Export Orders to Excel (.xlsx)
                </button>
                <button
                  onClick={handleExportAllToExcel}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition text-xs font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Export Master Dataset (.xlsx)
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition text-xs font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Review Pending Quotes ({stats.pendingQuotesCount})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter by title, SKU, category..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 pl-9 shadow-sm"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleExportProductsToExcel}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Catalog (.xlsx)
                </button>
                {products.length > 0 && (
                  <button
                    onClick={handleDeleteAllProducts}
                    className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete All Products
                  </button>
                )}
                <button
                  onClick={() => {
                    openEditProductModal({
                      sku: `SM3D-${Math.floor(100 + Math.random() * 900)}`,
                      name: '',
                      category: 'Miniatures',
                      description: '',
                      dimensions: '100 x 100 x 100 mm',
                      dimensionsObj: { length: 100, width: 100, height: 100 },
                      material: 'PLA',
                      colors: ['Pure White', 'Black'],
                      price: 499,
                      stock: 10,
                      lowStockThreshold: 3,
                      image: '/assets/images/hero_3d_printer_1786179196218.webp',
                      featured: false,
                      stlUrl: '',
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Product
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-950/80 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Image</th>
                    <th className="p-3.5">Name / SKU</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Dimensions</th>
                    <th className="p-3.5">Material</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Stock</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No products in catalog. Click "Add New Product" to create a new product listing.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="p-3.5">
                        <img
                          src={p.image || '/assets/images/product_dragon_1786179208256.webp'}
                          alt={p.name}
                          className="w-11 h-11 object-cover rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-950"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/product_dragon_1786179208256.webp';
                          }}
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900 dark:text-white">{p.name}</div>
                        <div className="font-mono text-[10px] text-gray-500">{p.sku}</div>
                      </td>
                      <td className="p-3.5">{p.category}</td>
                      <td className="p-3.5 font-mono">{p.dimensions}</td>
                      <td className="p-3.5">{p.material}</td>
                      <td className="p-3.5 font-extrabold text-gray-900 dark:text-white">₹{p.price}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.stock <= (p.lowStockThreshold || 3)
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                        }`}>
                          {p.stock} in stock
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {p.stlUrl && (
                          <button
                            onClick={() => setStlModalUrl(p.stlUrl || null)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-amber-500 dark:text-amber-400 font-medium text-[11px]"
                            title="Inspect 3D STL Model"
                          >
                            3D
                          </button>
                        )}
                        <button
                          onClick={() => openEditProductModal(p)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/30 text-amber-500 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/40 font-medium text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 font-medium text-[11px]"
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CUSTOM ORDERS TAB */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Custom 3D Print Quote Requests</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Review specs, inspect uploaded 3D files, and dispatch quote estimates to customers.</p>
              </div>

              <button
                onClick={handleExportCustomOrdersToExcel}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Quotes (.xlsx)
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-950/80 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">ID / Date</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Description & Specs</th>
                    <th className="p-3.5">Dimensions</th>
                    <th className="p-3.5">Material & Infill</th>
                    <th className="p-3.5">Quote Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                  {customOrders.map((co) => (
                    <tr key={co.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{co.id}</span>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {co.createdAt ? new Date(co.createdAt).toLocaleDateString() : ''}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white">{co.userName}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{co.userEmail}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{co.userPhone}</div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-white line-clamp-2">{co.description}</div>
                        {co.fileName && (
                          <div className="text-[10px] text-amber-500 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                            <span>📎 {co.fileName}</span>
                            {co.fileUrl && (
                              <button
                                onClick={() => setStlModalUrl(co.fileUrl || null)}
                                className="underline ml-1"
                              >
                                View 3D
                              </button>
                            )}
                          </div>
                        )}
                        {co.adminNotes && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-300 mt-0.5">
                            Note: {co.adminNotes}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono">
                        {co.dimensions?.length}×{co.dimensions?.width}×{co.dimensions?.height} mm
                        {co.exceedsLimit && (
                          <span className="block text-[10px] text-amber-500 font-semibold">Multi-part split</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-gray-900 dark:text-gray-200">{co.desiredMaterial} ({co.desiredColor})</div>
                        <div className="text-[10px] text-gray-500">{co.infillDensity} infill</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          co.status === 'Quoted'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                        }`}>
                          {co.status || 'Requested'}
                        </span>
                        <div className="font-extrabold text-gray-900 dark:text-white mt-1">
                          {co.quotePrice ? `₹${co.quotePrice}` : 'Unquoted'}
                        </div>
                      </td>
                      <td className="p-3.5 text-right space-y-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setQuotingOrder(co);
                            setQuotePriceInput(co.quotePrice ? String(co.quotePrice) : '');
                            setQuoteNotesInput(co.adminNotes || '');
                            setQuoteModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-[11px] block w-full text-center shadow-sm"
                        >
                          Set Quote
                        </button>
                        <div className="flex items-center gap-1">
                          <select
                            value={co.status}
                            onChange={(e) => handleUpdateCustomStatus(co.id, e.target.value)}
                            className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="Requested">Requested</option>
                            <option value="Quoted">Quoted</option>
                            <option value="In Production">In Production</option>
                            <option value="Printed">Printed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <button
                            onClick={() => handleDeleteCustomOrder(co.id, co.userName)}
                            title="Delete Custom Print Quote"
                            className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            aria-label={`Delete custom order ${co.id}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customer Store Orders</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Real-time fulfillment tracking and Excel reporting.</p>
              </div>

              <button
                onClick={handleExportOrdersToExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 self-start sm:self-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel (.xlsx)
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-950/80 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Customer & Shipping</th>
                    <th className="p-3.5">Items Purchased</th>
                    <th className="p-3.5">Total (₹)</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5">Fulfillment Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-amber-500 dark:text-amber-400">{ord.id}</span>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : ''}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white">{ord.userName}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{ord.userEmail} • {ord.userPhone}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {ord.shippingAddress?.street}, {ord.shippingAddress?.city} {ord.shippingAddress?.pincode}
                        </div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="text-gray-800 dark:text-gray-300">
                            • {it.name} <span className="text-gray-500">×{it.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="p-3.5 font-extrabold text-gray-900 dark:text-white">
                        ₹{ord.total}
                      </td>
                      <td className="p-3.5">
                        {(() => {
                          const currentOpt = getOrderPaymentOption(ord);
                          const badge = getPaymentBadge(currentOpt);
                          return (
                            <div className="flex flex-col gap-1.5 min-w-[125px]">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}>
                                  <span>{badge.icon}</span>
                                  <span>{currentOpt}</span>
                                </span>
                              </div>
                              <select
                                value={currentOpt}
                                onChange={(e) => handleUpdateOrderPayment(ord.id, e.target.value)}
                                className="bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm"
                              >
                                <option value="Paid">Paid</option>
                                <option value="Not Paid">Not Paid</option>
                                <option value="COD">COD</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Bank Account">Bank Account</option>
                                <option value="UPI">UPI</option>
                              </select>
                              {ord.paymentMethod && ord.paymentMethod !== currentOpt && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]" title={ord.paymentMethod}>
                                  Method: {ord.paymentMethod}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3.5">
                        <select
                          value={ord.fulfillmentStatus || 'Processing'}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          className="bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Printed">Printed</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteOrder(ord.id, ord.userName)}
                          title="Delete Order & Customer Data"
                          className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition inline-flex items-center justify-center border border-transparent hover:border-red-200 dark:hover:border-red-800"
                          aria-label={`Delete order ${ord.id}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Registered Accounts & Staff Directory</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">View customer accounts or edit system administrator credentials.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-950/80 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Account ID</th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="p-3.5 font-mono text-gray-500 dark:text-gray-400">{u.id}</td>
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">{u.name}</td>
                      <td className="p-3.5">{u.email}</td>
                      <td className="p-3.5">{u.phone || 'N/A'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.role === 'admin'
                            ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/40'
                            : 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40'
                        }`}>
                          {u.role === 'admin' ? 'Administrator' : 'Customer'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 dark:text-gray-400">
                        {[u.city, u.state].filter(Boolean).join(', ') || 'India'}
                      </td>
                      <td className="p-3.5 text-right">
                        {u.role === 'admin' ? (
                          <Link
                            to={`/admin/edit/${u.id}`}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-[11px] shadow-sm hover:opacity-90 inline-block"
                          >
                            Edit Admin
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title="Delete Customer Account"
                            className="px-2 py-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition inline-flex items-center gap-1 text-[11px] font-medium border border-transparent hover:border-red-200 dark:hover:border-red-800"
                            aria-label={`Delete customer ${u.name}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. PAYMENTS & STATEMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Top Gateway Configuration Form */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>💳</span> Payment Gateway, UPI QR & Banking Setup
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Configure your UPI QR scanner, UPI ID, Razorpay Key, and Bank Account details for customer checkout.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePaymentSettings} className="space-y-4 text-xs">
                {/* UPI QR Code Scanner Upload */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 space-y-3">
                  <label className="block font-semibold text-gray-800 dark:text-gray-200 text-xs">
                    UPI Scanner QR Image (Accepts any image format)
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {settings.upiQrImage ? (
                      <div className="relative group">
                        <img
                          src={settings.upiQrImage}
                          alt="UPI QR Scanner"
                          className="w-24 h-24 object-contain rounded-xl border border-gray-300 dark:border-gray-700 bg-white p-1 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded">Live QR</span>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 text-[10px] p-2 text-center bg-gray-100 dark:bg-gray-900">
                        <span>📱</span>
                        <span>No QR Uploaded</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-2 w-full">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/40 transition text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>{uploadingQr ? 'Uploading QR Image...' : 'Upload UPI Scanner Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQrUpload}
                          disabled={uploadingQr}
                        />
                      </label>
                      <input
                        type="text"
                        value={settings.upiQrImage || ''}
                        onChange={(e) => setSettings({ ...settings, upiQrImage: e.target.value })}
                        placeholder="Image URL: /uploads/qr.png or https://..."
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* UPI ID & Razorpay Key ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Admin UPI ID</label>
                    <input
                      type="text"
                      value={settings.upiId || ''}
                      onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                      placeholder="e.g. shreemanekar0@okaxis"
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Razorpay Key ID</label>
                    <input
                      type="text"
                      value={settings.razorpayId || ''}
                      onChange={(e) => setSettings({ ...settings, razorpayId: e.target.value })}
                      placeholder="e.g. rzp_live_xxxxxxxx or rzp_test_xxxx"
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                {/* Admin Bank Account Details */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 space-y-3">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                    Admin Bank Account Details (Displayed for Account Transfer Checkout)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={settings.accountHolderName || ''}
                        onChange={(e) => setSettings({ ...settings, accountHolderName: e.target.value })}
                        placeholder="e.g. SM 3D Technologies"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={settings.bankName || ''}
                        onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                        placeholder="e.g. State Bank of India"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={settings.accountNumber || ''}
                        onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                        placeholder="e.g. 928411860101"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={settings.ifscCode || ''}
                        onChange={(e) => setSettings({ ...settings, ifscCode: e.target.value })}
                        placeholder="e.g. SBIN0001234"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
                >
                  Save Payment Credentials
                </button>
              </form>
            </div>

            {/* Statements of Received Payments Table */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>📑</span> Statements of Received Payments
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Real-time payment ledger collecting UPI transaction IDs, amounts, and uploaded proof screenshots.
                  </p>
                </div>

                <button
                  onClick={handleExportPaymentsToExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 self-start sm:self-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Statements (.xlsx)
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-950/80 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">Date & Order ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Payment Method</th>
                      <th className="p-3.5">UPI Transaction ID</th>
                      <th className="p-3.5">Proof Screenshot</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-400">
                          No customer payment statements recorded yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-amber-500 dark:text-amber-400">{ord.id}</span>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : ''}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-gray-900 dark:text-white">{ord.userName}</div>
                            <div className="text-[10px] text-gray-500">{ord.userEmail}</div>
                            <div className="text-[10px] text-gray-500">{ord.userPhone}</div>
                          </td>
                          <td className="p-3.5 font-extrabold text-gray-900 dark:text-white">
                            ₹{ord.total}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                              {ord.paymentMethod || 'Account transfer'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {ord.upiTransactionId ? (
                              <div className="flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 rounded-lg w-fit">
                                <span>{ord.upiTransactionId}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(ord.upiTransactionId || '');
                                    showToast('Copied UPI ID to clipboard');
                                  }}
                                  title="Copy UPI Transaction ID"
                                  className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300"
                                >
                                  📋
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Direct Payment</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {ord.paymentScreenshotUrl ? (
                              <button
                                type="button"
                                onClick={() => setScreenshotModalUrl(ord.paymentScreenshotUrl || null)}
                                className="group relative flex items-center gap-2 p-1 rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                              >
                                <img
                                  src={ord.paymentScreenshotUrl}
                                  alt="Payment Proof"
                                  className="w-9 h-9 object-cover rounded-md border border-gray-300 dark:border-gray-700"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/images/product_dragon_1786179208256.webp';
                                  }}
                                />
                                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 pr-1">
                                  🔍 View Proof
                                </span>
                              </button>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">No screenshot</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentStatus(ord.id, ord.paymentStatus)}
                              title="Click to toggle payment verification"
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                ord.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100'
                              }`}
                            >
                              {ord.paymentStatus === 'Paid' ? '✓ Paid / Verified' : '⏳ Pending Review'}
                            </button>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleDeleteOrder(ord.id, ord.userName)}
                              title="Delete Order & Payment Statement"
                              className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition inline-flex items-center justify-center border border-transparent hover:border-red-200 dark:hover:border-red-800"
                              aria-label={`Delete statement for ${ord.id}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. SETTINGS & TECH SPECS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            {/* General Store Settings */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Store & Global Parameters</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">Manage global store parameters, shipping fee, and customer contact details.</p>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={settings.storeName || ''}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Store Tagline</label>
                  <input
                    type="text"
                    value={settings.storeTagline || ''}
                    onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Max Build Dimension (mm)</label>
                    <input
                      type="number"
                      value={settings.maxPrintDimension || 160}
                      onChange={(e) => setSettings({ ...settings, maxPrintDimension: parseInt(e.target.value) || 160 })}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Standard Shipping (₹)</label>
                    <input
                      type="number"
                      value={settings.shippingFee || 99}
                      onChange={(e) => setSettings({ ...settings, shippingFee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Free Shipping Threshold (₹)</label>
                    <input
                      type="number"
                      value={settings.freeShippingThreshold || 500}
                      onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Support WhatsApp Number</label>
                    <input
                      type="text"
                      value={settings.whatsappNumber || ''}
                      onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Support Contact Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail || ''}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Store Currency Symbol</label>
                    <input
                      type="text"
                      placeholder="₹ (INR)"
                      value={settings.currency || '₹'}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Standard Tax Rate (GST %)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="18"
                      value={settings.taxRate !== undefined ? settings.taxRate : 18}
                      onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                    />
                  </div>
                </div>

                {/* 3D MACHINE TECH SPECS EDITABLE SECTION */}
                <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-3.5 mt-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-extrabold text-base">⚙️</span>
                      3D Printer Hardware Technical Specifications [TECH SPECS]
                    </h3>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      These specifications are displayed live in the website footer and custom 3D printing technical specifications dialogs.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Max Build Volume</label>
                      <input
                        type="text"
                        value={settings.techSpecs?.buildVolume || '160 × 160 × 160 mm'}
                        onChange={(e) => setSettings({
                          ...settings,
                          techSpecs: { ...(settings.techSpecs || {}), buildVolume: e.target.value }
                        })}
                        placeholder="e.g. 160 × 160 × 160 mm"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-purple-400 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Layer Height Resolution</label>
                      <input
                        type="text"
                        value={settings.techSpecs?.layerHeight || '0.12 - 0.28 mm'}
                        onChange={(e) => setSettings({
                          ...settings,
                          techSpecs: { ...(settings.techSpecs || {}), layerHeight: e.target.value }
                        })}
                        placeholder="e.g. 0.12 - 0.28 mm"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-purple-400 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Compatible Materials</label>
                      <input
                        type="text"
                        value={settings.techSpecs?.materials || 'PLA, PETG, ABS, CF-PETG, TPU'}
                        onChange={(e) => setSettings({
                          ...settings,
                          techSpecs: { ...(settings.techSpecs || {}), materials: e.target.value }
                        })}
                        placeholder="e.g. PLA, PETG, ABS, CF-PETG, TPU"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-purple-400 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Nozzle Size & Type</label>
                      <input
                        type="text"
                        value={settings.techSpecs?.nozzleSize || '0.4 mm Hardened Precision'}
                        onChange={(e) => setSettings({
                          ...settings,
                          techSpecs: { ...(settings.techSpecs || {}), nozzleSize: e.target.value }
                        })}
                        placeholder="e.g. 0.4 mm Hardened Precision"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-purple-400 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Print Speed</label>
                      <input
                        type="text"
                        value={settings.techSpecs?.printSpeed || 'Up to 250 mm/s'}
                        onChange={(e) => setSettings({
                          ...settings,
                          techSpecs: { ...(settings.techSpecs || {}), printSpeed: e.target.value }
                        })}
                        placeholder="e.g. Up to 250 mm/s"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-purple-400 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Technology & Extrusion</label>
                      <input
                        type="text"
                        value={settings.techSpecs?.notes || 'Industrial Grade Direct Drive Extrusion'}
                        onChange={(e) => setSettings({
                          ...settings,
                          techSpecs: { ...(settings.techSpecs || {}), notes: e.target.value }
                        })}
                        placeholder="e.g. Industrial Grade Direct Drive Extrusion"
                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-purple-400 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-500/20 transition flex items-center gap-2 mt-4"
                >
                  Save Store & Tech Specs Settings
                </button>
              </form>
            </div>

            {/* Delivery Cities Coverage Quick Navigation Banner */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🚚 Nationwide Delivery Coverage Network</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                    {deliveryCities.filter(c => c.active !== false).length} Active Cities
                  </span>
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Manage the full directory of deliverable destinations, turnaround estimates, and expand to new cities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setActiveTab('delivery'); setSearchParams({ tab: 'delivery' }); }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-500 transition flex items-center gap-2 shrink-0"
              >
                Open Delivery Network Manager →
              </button>
            </div>
          </div>
        )}

        {/* 8. DELIVERY & CITY COVERAGE TAB */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🚚 Nationwide Delivery & Shipping Coverage</span>
                    <span className="text-xs bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                      {deliveryCities.filter(c => c.active !== false).length} Active Destinations
                    </span>
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Manage the list of cities shown to customers on the storefront, check delivery availability, and add new delivery hubs nationwide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddCityModal}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add New Delivery City
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-xs">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 block text-[11px]">Total Configured</span>
                  <span className="text-lg font-extrabold text-gray-900 dark:text-white">{deliveryCities.length} Cities</span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 block text-[11px]">Active Delivering</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {deliveryCities.filter(c => c.active !== false).length} Cities
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 block text-[11px]">States Covered</span>
                  <span className="text-lg font-extrabold text-amber-500 dark:text-amber-400">
                    {[...new Set(deliveryCities.map(c => c.state).filter(Boolean))].length} States / UTs
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500 block text-[11px]">Fastest Turnaround</span>
                  <span className="text-lg font-extrabold text-amber-500 dark:text-amber-400">1-2 Days (Local)</span>
                </div>
              </div>
            </div>

            {/* City Table and Search */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={deliveryCitySearch}
                    onChange={(e) => setDeliveryCitySearch(e.target.value)}
                    placeholder="Search city, state, or PIN codes..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {deliveryCitySearch && (
                    <button
                      onClick={() => setDeliveryCitySearch('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Showing <strong>{filteredDeliveryCities.length}</strong> of {deliveryCities.length} cities
                </div>
              </div>

              {filteredDeliveryCities.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                  <span className="text-3xl block mb-2">🏙️</span>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">No delivery cities found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {deliveryCitySearch ? `No locations match "${deliveryCitySearch}".` : 'No cities have been configured yet.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {deliveryCitySearch && (
                      <button
                        onClick={() => setDeliveryCitySearch('')}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold"
                      >
                        Reset Search
                      </button>
                    )}
                    <button
                      onClick={handleOpenAddCityModal}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow"
                    >
                      + Add New City
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-950/80 text-gray-700 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">City Destination</th>
                        <th className="py-3 px-4">State / Region</th>
                        <th className="py-3 px-4">Est. Turnaround</th>
                        <th className="py-3 px-4">Coverage Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {filteredDeliveryCities.map((city) => (
                        <tr key={city.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-950/40 transition">
                          <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <div>
                                <span className="font-bold">{city.name}</span>
                                {city.pincodes && (
                                  <span className="block text-[10px] text-gray-500 font-mono">PIN: {city.pincodes}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                            {city.state || 'All India'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              city.estimatedDays?.includes('1-2')
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : city.estimatedDays?.includes('2-3')
                                ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30'
                                : 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30'
                            }`}>
                              ⚡ {city.estimatedDays || '2-4 Days'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {(() => {
                              const isAct = city.active !== false && (city as any).isActive !== false;
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleToggleCityActive(city)}
                                  title={isAct ? 'Click to pause delivery' : 'Click to resume delivery'}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                                    isAct
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                      : 'bg-gray-200 dark:bg-gray-800 text-gray-500 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                  {isAct ? 'Active Delivery' : 'Paused / Inactive'}
                                </button>
                              );
                            })()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCityModal(city)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-amber-500 dark:text-amber-400 transition"
                                title="Edit City Details"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button
                                onClick={() => handleDeleteCity(city.id, city.name)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition"
                                title="Delete City"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. FINANCIAL STATEMENTS & REVENUE LEDGER TAB */}
        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0b0f17] border border-gray-200/80 dark:border-white/[0.08] shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-1">Financial Intelligence</div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>📊</span> Financial Statements & Revenue Analytics
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Audited Gross Merchandise Value (GMV), payment channel allocations, and transactional ledger.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportFinancesXlsx}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>Export Statement (.xlsx)</span>
                  </button>
                  <button
                    onClick={loadAllData}
                    className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* 4 Financial Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121824] border border-gray-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Gross Revenue (GMV)</div>
                  <div className="text-2xl font-black text-amber-500 font-mono mt-1">
                    ₹{(financialSummary?.totalRevenue || stats.totalRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <span>📦</span> Across {orders.length} orders
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121824] border border-gray-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Paid Revenue Collected</div>
                  <div className="text-2xl font-black text-emerald-500 font-mono mt-1">
                    ₹{(financialSummary?.paidRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <span>✓</span> Verified cash receipts
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121824] border border-gray-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Pending / Awaiting Pay</div>
                  <div className="text-2xl font-black text-yellow-500 font-mono mt-1">
                    ₹{(financialSummary?.pendingRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                    <span>⏳</span> In verification pipeline
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121824] border border-gray-200/80 dark:border-white/[0.08]">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Average Order Value (AOV)</div>
                  <div className="text-2xl font-black text-purple-400 font-mono mt-1">
                    ₹{(financialSummary?.averageOrderValue || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <span>🚚</span> Shipping: ₹{(financialSummary?.shippingTotal || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Analytical Charts & Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Payment Channel Allocation */}
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121824] border border-gray-200/80 dark:border-white/[0.08]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                    <span>💳</span> Payment Channel Allocation
                  </h3>
                  <div className="space-y-3">
                    {financialSummary?.paymentMethodsBreakdown && Object.keys(financialSummary.paymentMethodsBreakdown).length > 0 ? (
                      Object.entries(financialSummary.paymentMethodsBreakdown).map(([method, amount]: [string, any]) => {
                        const total = financialSummary.totalRevenue || 1;
                        const pct = Math.round((Number(amount) / total) * 100);
                        return (
                          <div key={method} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{method}</span>
                              <span className="font-mono font-bold text-gray-900 dark:text-white">₹{amount.toLocaleString()} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-gray-500 py-4 text-center">No payment transactions recorded yet.</div>
                    )}
                  </div>
                </div>

                {/* Fulfillment Status Breakdown */}
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121824] border border-gray-200/80 dark:border-white/[0.08]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                    <span>⚙️</span> Production & Fulfillment Pipeline
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {financialSummary?.fulfillmentStatusBreakdown && Object.entries(financialSummary.fulfillmentStatusBreakdown).map(([status, count]: [string, any]) => (
                      <div key={status} className="p-3 rounded-xl bg-white dark:bg-[#0b0f17] border border-gray-200 dark:border-gray-800">
                        <div className="text-[10px] uppercase font-bold text-gray-400">{status}</div>
                        <div className="text-lg font-black text-gray-900 dark:text-white font-mono mt-0.5">{count} orders</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders Ledger Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <span>📜</span> Transactional Order Ledger
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/[0.08]">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Fulfillment</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                          <td className="py-3 px-4 font-mono font-bold text-amber-500">{o.id}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900 dark:text-white">{o.userName}</div>
                            <div className="text-[10px] text-gray-400">{o.userEmail}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">₹{o.total}</td>
                          <td className="py-3 px-4 text-[11px]">{o.paymentMethod}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                              {o.fulfillmentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[10px] text-gray-400">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. ENTERPRISE RFQS TAB */}
        {activeTab === 'rfqs' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0b0f17] border border-gray-200/80 dark:border-white/[0.08] shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-1">B2B Manufacturing</div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🏢</span> Enterprise & Commercial RFQ Desk
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Review and quote enterprise inquiries, high-volume production runs, and NDA-protected institutional parts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportRfqsXlsx}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>Export RFQs (.xlsx)</span>
                  </button>
                  <button
                    onClick={loadAllData}
                    className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Filter inquiries by company, contact, material, or RFQ ID..."
                  value={rfqSearch}
                  onChange={(e) => setRfqSearch(e.target.value)}
                  className="w-full sm:max-w-md bg-gray-50 dark:bg-[#121824] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              {filteredRfqs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No Enterprise RFQs match your filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/[0.08]">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">RFQ ID</th>
                        <th className="py-3 px-4">Company & Contact</th>
                        <th className="py-3 px-4">Units & Material</th>
                        <th className="py-3 px-4">Target Timeline</th>
                        <th className="py-3 px-4">NDA</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {filteredRfqs.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-500">{r.id}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">{r.companyName || 'Independent'}</div>
                            <div className="text-[11px] text-gray-500">{r.contactName} ({r.phone})</div>
                            <div className="text-[10px] text-gray-400 font-mono">{r.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-amber-400 text-sm">{r.quantity} pcs</span>
                            <div className="text-[11px] text-gray-400">{r.material}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium">
                            {r.targetDate}
                          </td>
                          <td className="py-3.5 px-4">
                            {r.ndaRequired ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                NDA Required
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">Standard</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={r.status || 'Received'}
                              onChange={(e) => handleUpdateRfqStatus(r.id, e.target.value)}
                              className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-amber-400"
                            >
                              <option value="Received">Received</option>
                              <option value="In Review">In Review</option>
                              <option value="Quoted">Quoted</option>
                              <option value="Fulfilled">Fulfilled</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRfq(r.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition"
                              title="Delete RFQ record"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 11. REVIEWS MODERATION TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0b0f17] border border-gray-200/80 dark:border-white/[0.08] shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-1">Customer Feedback</div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>⭐</span> Customer Reviews & Showcase Moderation
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Moderate customer ratings, verified purchase badges, and showcase photos displayed on the live website.
                  </p>
                </div>
                <button
                  onClick={loadAllData}
                  className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Refresh
                </button>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No reviews submitted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-gray-50 dark:bg-[#121824] border border-gray-200/80 dark:border-white/[0.08] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{rev.customerName}</span>
                            <span className="ml-2 text-[10px] text-gray-400">{rev.date}</span>
                          </div>
                          <div className="flex text-amber-400 text-xs">
                            {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                              <span key={i}>★</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[11px] font-semibold text-amber-500">{rev.productName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            {rev.material || 'PLA+'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                          "{rev.review}"
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">
                          {rev.printTime && `Print: ${rev.printTime}`} {rev.weight && `• ${rev.weight}`}
                        </span>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-semibold transition"
                        >
                          Remove Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT CREATE / EDIT MODAL */}
      {productModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {editingProduct.id ? 'Edit Product Listing' : 'Create New Product Listing'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Miniatures'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="Miniatures">Miniatures</option>
                    <option value="Functional Parts">Functional Parts</option>
                    <option value="Decorative">Decorative</option>
                    <option value="Enclosures">Enclosures</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Articulated Crystal Dragon"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Stock (Units)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock !== undefined ? editingProduct.stock : 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Material Dropdown with + Add More Filament Feature (Issue 4 Fix: not stuck on PLA) */}
              <div className="p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-gray-700 dark:text-gray-300">
                    Material / Filament Type
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddFilamentModal(true)}
                    className="text-[11px] font-semibold text-amber-500 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1"
                  >
                    <span>+ Add More Filament</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <select
                    value={editingProduct.material || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                    className="w-1/2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Choose Filament...</option>
                    {(settings.availableFilaments || ['PLA', 'PETG', 'ABS', 'CF-PETG', 'TPU', 'Marble PLA', 'Silk Rainbow PLA', 'Nylon', 'Resin']).map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={editingProduct.material || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                    placeholder="Or type custom material..."
                    className="w-1/2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Separate Dimension Boxes (Length, Width, Height) - Numbers Only (Issue 1 Fix) */}
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Dimensions (Separate Boxes • Numbers Only in mm)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5 font-medium">Length (mm)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={editLength}
                      onChange={(e) => handleDimChange('length', parseInt(e.target.value) || 1)}
                      placeholder="100"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5 font-medium">Width (mm)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={editWidth}
                      onChange={(e) => handleDimChange('width', parseInt(e.target.value) || 1)}
                      placeholder="100"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5 font-medium">Height (mm)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={editHeight}
                      onChange={(e) => handleDimChange('height', parseInt(e.target.value) || 1)}
                      placeholder="100"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 font-mono">
                  Calculated Dimension: {editLength} × {editWidth} × {editHeight} mm
                </div>
              </div>

              {/* Image Upload Box + Image URL (Issue 2 Fix) */}
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Image (Upload File or Image URL)
                </label>
                <div className="flex items-center gap-3">
                  {editingProduct.image ? (
                    <img
                      src={editingProduct.image}
                      alt="Product Preview"
                      className="w-14 h-14 object-cover rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-950 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/product_dragon_1786179208256.webp';
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 text-[10px] flex-shrink-0">
                      No Img
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/40 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>{uploadingImage ? (imgUploadProgress !== null ? `Uploading (${imgUploadProgress}%)...` : 'Uploading...') : 'Upload Image / 3D Model File'}</span>
                      <input
                        type="file"
                        accept="image/*,.stl,.3mf,.obj,.step,.stp"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>

                    <input
                      type="text"
                      value={editingProduct.image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      placeholder="Or enter direct Image URL: /uploads/img.webp or https://..."
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 3D Model Attachment Optional Checkbox Section */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-[#0B0F17]/80 p-4 shadow-lg backdrop-blur-md">
                {/* Header & Checkbox */}
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="includeModelCheckbox"
                      checked={includeModel}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeModel(checked);
                        if (!checked && editingProduct) {
                          setEditingProduct({ ...editingProduct, stlUrl: '' });
                        }
                      }}
                      className="h-4 w-4 rounded border-amber-500/40 bg-white dark:bg-black/60 text-amber-500 accent-amber-500 focus:ring-amber-400 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-amber-200 text-xs">
                        Attach 3D Model File <span className="text-[11px] text-amber-500 font-normal">(Optional)</span>
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Enable to upload an interactive .STL or .3MF preview file for this item.
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                    includeModel 
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300' 
                      : 'border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 text-gray-400'
                  }`}>
                    {includeModel ? 'Enabled' : 'Disabled'}
                  </span>
                </label>

                {/* Conditional Upload Box - Only rendered when checkbox is active */}
                {includeModel && (
                  <div className="mt-3.5 pt-3.5 border-t border-amber-500/15 space-y-3">
                    {/* 3D Model Display Name */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-300 mb-1">
                        3D Model Display Name
                      </label>
                      <input
                        type="text"
                        value={editingProduct.modelName !== undefined ? editingProduct.modelName : (editingProduct.name ? `${editingProduct.name} Model` : '')}
                        onChange={(e) => setEditingProduct({ ...editingProduct, modelName: e.target.value })}
                        placeholder="e.g. Precision Bracket v2 (STL)"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/60 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* 3D Model Upload (.stl, .3mf) or Direct URL */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-300">
                          3D Model Upload (.stl, .3mf, .obj) or Direct URL
                        </label>
                        {editingProduct.stlUrl && (
                          <button
                            type="button"
                            onClick={() => setStlModalUrl(editingProduct.stlUrl || null)}
                            className="text-[11px] font-semibold text-amber-500 hover:underline flex items-center gap-1"
                          >
                            👁️ Preview in 3D
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingProduct.stlUrl || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stlUrl: e.target.value })}
                          placeholder="/uploads/model.stl or https://..."
                          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/60 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:border-amber-500 focus:outline-none font-mono"
                        />
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 px-3.5 py-1.5 text-xs font-bold text-gray-950 shadow-md hover:from-amber-400 hover:to-yellow-500 transition-all flex-shrink-0">
                          <span>{uploadingStl ? (stlUploadProgress !== null ? `Uploading (${stlUploadProgress}%)...` : 'Uploading...') : 'Upload File'}</span>
                          <input
                            type="file"
                            accept=".stl,.3mf,.obj,.step,.stp"
                            className="hidden"
                            onChange={handleStlUpload}
                            disabled={uploadingStl}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        Supports .STL, .3MF, .OBJ, and STEP packages up to 200MB with real-time 3D viewport inspection.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-toggle"
                  checked={editingProduct.featured || false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-amber-500"
                />
                <label htmlFor="featured-toggle" className="text-gray-700 dark:text-gray-300">Display in Featured Showcase on Home page</label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-gray-950 font-bold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-500 transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUOTE MODAL */}
      {quoteModalOpen && quotingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-purple-500/40 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Set Quote for Order #{quotingOrder.id}</h3>
              <button onClick={() => setQuoteModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              Customer: <strong className="text-gray-900 dark:text-white">{quotingOrder.userName}</strong> ({quotingOrder.userEmail})<br />
              Requested Material: <span className="text-amber-500 dark:text-amber-400">{quotingOrder.desiredMaterial}</span> • Infill: {quotingOrder.infillDensity}
            </p>

            <form onSubmit={handleSaveQuote} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Quote Price (₹)</label>
                <input
                  type="number"
                  required
                  value={quotePriceInput}
                  onChange={(e) => setQuotePriceInput(e.target.value)}
                  placeholder="e.g. 750"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes (visible to customer)</label>
                <textarea
                  rows={3}
                  value={quoteNotesInput}
                  onChange={(e) => setQuoteNotesInput(e.target.value)}
                  placeholder="e.g. Infill recommended at 30% gyroid for structural strength."
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25"
                >
                  Confirm & Dispatch Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D STL VIEWER MODAL */}
      {stlModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-amber-500/40 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <span className="text-amber-500">⚡</span> Interactive 3D STL Inspection
                <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Adaptive Auto-Fit Preview • No 160mm Limit
                </span>
              </span>
              <button
                onClick={() => setStlModalUrl(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <StlViewer
                stlUrl={stlModalUrl}
                fileName={stlModalUrl || undefined}
                height={460}
                noBuildLimit={true}
                allowScaleAdjustment={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SCREENSHOT PROOF HIGH-RES MODAL */}
      {screenshotModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-purple-500/40 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <span>📑</span> Customer UPI Payment Screenshot Proof
              </span>
              <button
                onClick={() => setScreenshotModalUrl(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-gray-50 dark:bg-gray-950">
              <img
                src={screenshotModalUrl}
                alt="Payment Proof Receipt"
                className="max-h-[65vh] w-auto object-contain rounded-xl border border-gray-200 dark:border-gray-800 shadow"
              />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <a
                href={screenshotModalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Open Full Image in New Tab ↗
              </a>
              <button
                type="button"
                onClick={() => setScreenshotModalUrl(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW FILAMENT TYPE MODAL */}
      {showAddFilamentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-amber-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <span>🧵</span> Add Custom Filament
              </h3>
              <button
                onClick={() => setShowAddFilamentModal(false)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Add a new material filament to your global catalog options (e.g. ASA, Wood PLA, Glow-in-the-Dark, Polycarbonate).
            </p>
            <form onSubmit={handleAddFilament} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filament Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFilamentName}
                  onChange={(e) => setNewFilamentName(e.target.value)}
                  placeholder="e.g. Wood PLA"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFilamentModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-500 transition"
                >
                  Add Filament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT DELIVERY CITY MODAL */}
      {deliveryCityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-amber-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <span>📍</span>
                <span>{editingCity ? `Edit Delivery City: ${editingCity.name}` : 'Add New Delivery City'}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setDeliveryCityModalOpen(false); setEditingCity(null); }}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              {editingCity
                ? 'Update shipping parameters and turnaround for this delivery destination.'
                : 'Expand SM 3D shipping coverage by adding a new city or regional hub.'}
            </p>

            <form onSubmit={handleSaveCity} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  placeholder="e.g. Chandrapur, Nagpur, Pune"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    State / Territory *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityForm.state}
                    onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Est. Turnaround *
                  </label>
                  <select
                    value={cityForm.estimatedDays}
                    onChange={(e) => setCityForm({ ...cityForm, estimatedDays: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                  >
                    <option value="1-2 Days">1-2 Days (Express / Local Hub)</option>
                    <option value="2-3 Days">2-3 Days (Standard Hub)</option>
                    <option value="2-4 Days">2-4 Days (Metro / Zonal)</option>
                    <option value="3-5 Days">3-5 Days (Regional / Nationwide)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Specific PIN Codes or Hub Notes (Optional)
                </label>
                <input
                  type="text"
                  value={cityForm.pincodes}
                  onChange={(e) => setCityForm({ ...cityForm, pincodes: e.target.value })}
                  placeholder="e.g. 442401, 442402, 442403 or 'All Pincodes'"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 shadow-sm"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cityForm.active}
                    onChange={(e) => setCityForm({ ...cityForm, active: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded border-gray-300 dark:border-gray-700 focus:ring-amber-500"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Active for customer checkout & storefront verification badge
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => { setDeliveryCityModalOpen(false); setEditingCity(null); }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={citySubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition flex items-center gap-2"
                >
                  {citySubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{editingCity ? 'Update City' : 'Add City to Network'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Admin;
