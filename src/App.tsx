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
import { LoadingCube } from './components/LoadingCube';

const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <LoadingCube />
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
      <Footer />
    </Router>
  );
};

export default App;
