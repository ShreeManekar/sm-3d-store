import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCart, ProductItem } from '../context/CartContext';

export interface Product extends ProductItem {
  dimensions: string;
}

export const PRODUCTS: Product[] = [
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

const CATEGORIES = ['All', 'Art & Figures', 'Engineering & Gadgets', 'Home & Decor', 'Desk Accessories'];

const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchQuery = searchParams.get('search') || '';

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesSearch =
        !searchQuery.trim() ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleAddToCart = (product: Product, goToCart: boolean = true) => {
    addToCart(product, 1);
    if (goToCart) {
      navigate('/cart');
    } else {
      setToastMessage(`Added "${product.name}" to cart!`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const getItemQuantityInCart = (productId: string) => {
    const item = items.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  const clearSearch = () => {
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-cyan-400/40 animate-fade-in">
            <svg className="w-5 h-5 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-semibold">{toastMessage}</span>
            <Link
              to="/cart"
              className="ml-2 text-xs font-bold underline hover:text-cyan-200 uppercase tracking-wider"
            >
              View Cart &rarr;
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">Catalog</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Shop Ready-Made 3D Prints</h1>
          <p className="text-gray-400 text-sm mt-1">
            Precision printed on tuned additive manufacturing hardware using high-grade filaments up to 160mm build volume.
          </p>
        </div>

        {/* Search Query Pill */}
        {searchQuery && (
          <div className="mb-6 flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm max-w-fit">
            <span className="text-gray-400">Search results for:</span>
            <span className="text-cyan-400 font-semibold">"{searchQuery}"</span>
            <button
              onClick={clearSearch}
              className="ml-2 text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800"
              title="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-white mb-1">No products found</h3>
            <p className="text-gray-400 text-sm mb-4">Try clearing your search query or selecting a different category.</p>
            <button
              onClick={() => {
                clearSearch();
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-cyan-400 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const qtyInCart = getItemQuantityInCart(product.id);
              return (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-cyan-500/50 transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-56 overflow-hidden bg-gray-950 flex items-center justify-center p-2 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                      {qtyInCart > 0 && (
                        <span className="absolute top-4 right-4 bg-cyan-500 text-gray-950 text-xs font-extrabold px-2 py-1 rounded-full shadow-lg">
                          {qtyInCart} in cart
                        </span>
                      )}
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddToCart(product, true)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition transform active:scale-95"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
