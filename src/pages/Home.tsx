import React from 'react';

const Home: React.FC = () => {
  return (
    <main className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Welcome to SM 3D Printing Store</h1>
      <p className="mb-6">Your one‑stop shop for 3D printed parts and custom prints.</p>
      {/* CTA buttons – same behaviour as original site */}
      <div className="flex gap-4">
        <a href="/shop" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
          Browse Store
        </a>
        <a href="/custom-print" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
          Order Custom 3D Print
        </a>
      </div>
    </main>
  );
};

export default Home;
