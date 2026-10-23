import React from 'react';

const Shop: React.FC = () => {
  return (
    <main className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Shop</h1>
      <p>Browse all available 3D printed products.</p>
      {/* Product grid would be populated here using SWR/fetch */}
    </main>
  );
};

export default Shop;
