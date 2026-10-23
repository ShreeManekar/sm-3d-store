import React from 'react';
import { Link } from 'react-router-dom';

const Cart: React.FC = () => {
  return (
    <main className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      <p>Your cart is currently empty.</p>
      <Link to="/shop" className="text-indigo-600 hover:underline">Continue shopping</Link>
    </main>
  );
};

export default Cart;
