import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#090d16] text-white">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/custom-print" element={<CustomPrint />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/edit/:id" element={<EditAdmin />} />
            <Route path="*" element={<NotFound />} />
            {/* Redirect legacy hash routes */}
            <Route path="/#!/shop" element={<Navigate to="/shop" replace />} />
            <Route path="/#!/custom-print" element={<Navigate to="/custom-print" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
