import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Shop from './pages/Shop';
import CustomPrint from './pages/CustomPrint';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import EditAdmin from './pages/EditAdmin';
import NotFound from './pages/NotFound';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartProvider } from './context/CartContext';

/**
 * Handles legacy hash-based URLs (e.g. #/shop, #!/shop, #!/custom-print)
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
    <CartProvider>
      <Router>
        <HashRedirectHandler />
        <div className="flex flex-col min-h-screen bg-[#090d16] text-white">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:id" element={<Navigate to="/shop" replace />} />
              <Route path="/custom-print" element={<CustomPrint />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/edit/:id" element={<EditAdmin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
};

export default App;
