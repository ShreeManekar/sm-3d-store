import React from 'react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  dimensions: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Articulated Crystal Dragon',
    price: 749,
    category: 'Art & Figures',
    description: 'Print-in-place flexible crystal dragon with moving articulated segments.',
    image: '/assets/images/product_dragon_1786179208256.webp',
    dimensions: '150 × 45 × 30 mm'
  },
  {
    id: 'prod_2',
    name: 'Planetary Gearbox Desk Fidget',
    price: 399,
    category: 'Engineering & Gadgets',
    description: 'Precision 5:1 planetary reduction gear toy with ultra-smooth rotation.',
    image: '/assets/images/product_gearbox_1786179220985.webp',
    dimensions: '75 × 75 × 22 mm'
  },
  {
    id: 'prod_3',
    name: 'Geometric Hexagon Planter',
    price: 449,
    category: 'Home & Decor',
    description: 'Modern geometric succulent pot with hidden internal water drainage tray.',
    image: '/assets/images/product_planter_1786179235105.webp',
    dimensions: '90 × 90 × 85 mm'
  },
  {
    id: 'prod_4',
    name: 'Minimalist Headphone Stand',
    price: 699,
    category: 'Desk Accessories',
    description: 'Curved ergonomic headphone holder with base cable management.',
    image: '/assets/images/product_headphone_stand_1786179253396.webp',
    dimensions: '140 × 120 × 240 mm'
  }
];

const Shop: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090d16] text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">Catalog</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Shop Ready-Made 3D Prints</h1>
          <p className="text-gray-400 text-sm mt-1">Precision printed on tuned additive manufacturing hardware using high-grade filaments.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="group rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-cyan-500/50 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="h-56 overflow-hidden bg-gray-950 flex items-center justify-center p-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="text-xs font-semibold text-cyan-400 mb-1">{product.category}</div>
                  <h3 className="font-bold text-lg text-white mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{product.description}</p>
                  <div className="text-xs text-gray-500">Dimensions: {product.dimensions}</div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-gray-800/80 flex items-center justify-between mt-4">
                <span className="text-xl font-extrabold text-cyan-400">₹{product.price}</span>
                <Link
                  to="/cart"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition"
                >
                  Add to Cart
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
