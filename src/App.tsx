import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Shop from './pages/Shop';
import CustomPrint from './pages/CustomPrint';
import MaterialsGuide from './pages/MaterialsGuide';
import OrderTracking from './pages/OrderTracking';
import Showcase from './pages/Showcase';
import KnowledgeBase from './pages/KnowledgeBase';
import EnterpriseRFQ from './pages/EnterpriseRFQ';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import Admin from './pages/Admin';
import EditAdmin from './pages/EditAdmin';
import NotFound from './pages/NotFound';
import { Header } from './components/Header';
import { AdminBar } from './components/AdminBar';
import { Footer } from './components/Footer';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

/**
 * Handles legacy hash-based URLs (e.g. #/shop, #!/shop, #!/custom-print, #/account, #/admin)
 * and seamlessly redirects them to HTML5 pushState routes.
 */
const HashRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash;
      const cleanPath = hash.replace(/^#[!]?\/?/, '/');
      if (cleanPath && cleanPath !== '/' && cleanPath !== location.pathname) {
        navigate(cleanPath, { replace: true });
      }
    }
  }, [location, navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <HashRedirectHandler />
            <div className="flex flex-col min-h-screen bg-[#fbfaf8] dark:bg-[#080b11] text-gray-900 dark:text-white transition-colors duration-200">
              <AdminBar />
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/shop/:id" element={<Navigate to="/shop" replace />} />
                  <Route path="/product/:id" element={<Navigate to="/shop" replace />} />
                  <Route path="/custom-print" element={<CustomPrint />} />
                  <Route path="/materials" element={<MaterialsGuide />} />
                  <Route path="/track" element={<OrderTracking />} />
                  <Route path="/showcase" element={<Showcase />} />
                  <Route path="/faq" element={<KnowledgeBase />} />
                  <Route path="/rfq" element={<EnterpriseRFQ />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/edit/:id" element={<EditAdmin />} />
                  <Route path="/admin-login" element={<Navigate to="/account?tab=admin" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <WhatsAppFloat />
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
