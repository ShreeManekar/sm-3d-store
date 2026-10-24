import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  fulfillmentStatus: string;
  orderNotes?: string;
  createdAt: string;
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
}

type TabType = 'overview' | 'products' | 'custom' | 'orders' | 'users' | 'settings';

export const Admin: React.FC = () => {
  const { currentUser, isAdmin, adminLogin, logout, getAdminHeaders } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Login States if not authenticated
  const [adminEmailInput, setAdminEmailInput] = useState('shreemanekar0@gmail.com');
  const [adminPasswordInput, setAdminPasswordInput] = useState('SM3dAdmin@9284');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Data collections
  const [products, setProducts] = useState<Product[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({});

  // Modals & Active Edit Entities
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

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
      const [pRes, cRes, oRes, uRes, sRes] = await Promise.all([
        axios.get('/api/products').catch(() => ({ data: [] })),
        axios.get('/api/custom-orders').catch(() => ({ data: [] })),
        axios.get('/api/orders').catch(() => ({ data: [] })),
        axios.get('/api/users', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/settings').catch(() => ({ data: {} })),
      ]);

      setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setCustomOrders(Array.isArray(cRes.data) ? cRes.data : []);
      setOrders(Array.isArray(oRes.data) ? oRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      setSettings(sRes.data || {});
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

    try {
      if (editingProduct.id) {
        // Edit existing product
        await axios.put(`/api/products/${editingProduct.id}`, editingProduct, { headers });
        showToast('Product updated successfully');
      } else {
        // Create new product
        await axios.post('/api/products', editingProduct, { headers });
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

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAdminHeaders();
    try {
      await axios.put('/api/settings', settings, { headers });
      showToast('Settings saved successfully');
      loadAllData();
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
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 px-4 py-3 rounded-2xl shadow-2xl text-xs flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onClick={loadAllData}
              className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-xs flex items-center gap-1.5 shadow-sm"
              title="Refresh Data"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            { id: 'users', label: 'Users & Admins', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'settings', label: 'Store & Machine Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
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
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
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
            </div>

            {/* Quick Actions & Recent Orders Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline">
                    View All →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-gray-500 py-3 text-center">No orders recorded yet.</p>
                ) : (
                  orders.slice(0, 4).map((ord) => (
                    <div key={ord.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{ord.id}</span>
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
                  onClick={() => { setEditingProduct({ colors: ['Pure White', 'Black'], dimensions: '100 x 100 x 100', price: 499, stock: 10 }); setProductModalOpen(true); }}
                  className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition text-xs font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create New Product Listing
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
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 pl-9 shadow-sm"
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
                <button
                  onClick={() => {
                    setEditingProduct({
                      sku: `SM3D-${Math.floor(100 + Math.random() * 900)}`,
                      name: '',
                      category: 'Miniatures',
                      description: '',
                      dimensions: '100 x 100 x 100',
                      material: 'PLA',
                      colors: ['Pure White', 'Black'],
                      price: 499,
                      stock: 10,
                      lowStockThreshold: 3,
                      image: '/assets/images/product_dragon_1786179208256.webp',
                      featured: true,
                      stlUrl: '/assets/models/sample_dragon.stl',
                    });
                    setProductModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
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
                  {filteredProducts.map((p) => (
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
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-cyan-600 dark:text-cyan-400 font-medium text-[11px]"
                            title="Inspect 3D STL Model"
                          >
                            3D
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingProduct({ ...p }); setProductModalOpen(true); }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-800/40 font-medium text-[11px]"
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
                  ))}
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
                          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-0.5 flex items-center gap-1">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{ord.id}</span>
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          {ord.paymentStatus || 'Paid'}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{ord.paymentMethod}</div>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={ord.fulfillmentStatus || 'Processing'}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          className="bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Printed">Printed</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
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
                            : 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/40'
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
                          <span className="text-gray-500 text-[11px]">Customer View</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xl max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Store & 3D Machine Settings</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">Manage global store parameters, max print bounding limits, and shipping thresholds.</p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName || ''}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Store Tagline</label>
                <input
                  type="text"
                  value={settings.storeTagline || ''}
                  onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Max Build Dimension (mm)</label>
                  <input
                    type="number"
                    value={settings.maxPrintDimension || 160}
                    onChange={(e) => setSettings({ ...settings, maxPrintDimension: parseInt(e.target.value) || 160 })}
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Standard Shipping (₹)</label>
                  <input
                    type="number"
                    value={settings.shippingFee || 99}
                    onChange={(e) => setSettings({ ...settings, shippingFee: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Free Shipping Threshold (₹)</label>
                  <input
                    type="number"
                    value={settings.freeShippingThreshold || 500}
                    onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
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
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Support Contact Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail || ''}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
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
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
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
                    className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400 shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-500/20 transition flex items-center gap-2 mt-4"
              >
                Save Settings
              </button>
            </form>
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
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Miniatures'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
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
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Material</label>
                  <input
                    type="text"
                    value={editingProduct.material || 'PLA'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Dimensions (L x W x H mm)</label>
                <input
                  type="text"
                  value={editingProduct.dimensions || '100 x 100 x 100'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, dimensions: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingProduct.image || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">3D Model STL URL (Optional)</label>
                <input
                  type="text"
                  value={editingProduct.stlUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stlUrl: e.target.value })}
                  placeholder="/assets/models/sample_dragon.stl"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-toggle"
                  checked={editingProduct.featured || false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-cyan-500"
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/20"
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
              Requested Material: <span className="text-cyan-600 dark:text-cyan-400">{quotingOrder.desiredMaterial}</span> • Infill: {quotingOrder.infillDensity}
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
          <div className="bg-white dark:bg-gray-900 border border-cyan-500/40 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <span className="text-cyan-500">⚡</span> Interactive 3D STL Inspection
              </span>
              <button onClick={() => setStlModalUrl(null)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1">✕</button>
            </div>
            <div className="p-4">
              <StlViewer stlUrl={stlModalUrl} height={400} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Admin;
