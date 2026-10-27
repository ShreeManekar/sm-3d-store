import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart, ProductItem } from '../context/CartContext';
import StlViewer from '../components/StlViewer';

export interface Product extends ProductItem {
  dimensions: string;
  stlUrl?: string;
  colors?: string[];
  material?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod_1786183436046',
    name: 'Dummy 13',
    price: 199,
    category: 'Miniatures',
    description: 'DIY White Dummy 13 Action Figure with articulated joints and accessories.',
    image: '/uploads/prod_1792667044370_IMG_6917.webp',
    dimensions: '150 × 50 × 100 mm',
    material: 'PETG',
    colors: ['Pure White'],
  },
  {
    id: 'prod_1786183434235',
    name: 'Modern Lamp',
    price: 499,
    category: 'Decorative',
    description: 'Minimalist 3D printed architectural desk lamp with flare shade.',
    image: '/uploads/prod_1786183434235_tempImageF3uTwb.png',
    dimensions: '100 × 100 × 100 mm',
    material: 'PLA',
    colors: ['IVORY'],
  },
];

const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [active3dProduct, setActive3dProduct] = useState<Product | null>(null);

  const searchQuery = searchParams.get('search') || '';

  // Synchronize catalog with backend database if accessible
  useEffect(() => {
    let isMounted = true;
    axios
      .get('/api/products')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data)) {
          const loaded: Product[] = res.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            category: p.category || 'General',
            description: p.description || '',
            image: p.image || p.images?.[0] || '/assets/images/hero_3d_printer_1786179196218.webp',
            dimensions: typeof p.dimensions === 'string' ? p.dimensions : '100 × 100 × 100 mm',
            stlUrl: p.stlUrl || '',
            material: p.material || 'PLA',
            colors: p.colors || [],
          }));
          setProducts(loaded);
        }
      })
      .catch(() => {
        // Fallback only if server completely unreachable
        setProducts(PRODUCTS);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !searchQuery.trim() ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

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
    <div className="min-h-screen bg-transparent text-inherit py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-600 text-gray-950 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-amber-400/40 animate-fade-in font-bold">
            <svg className="w-5 h-5 text-gray-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-bold">{toastMessage}</span>
            <Link
              to="/cart"
              className="ml-2 text-xs font-black underline hover:text-gray-800 uppercase tracking-wider"
            >
              View Cart &rarr;
            </Link>
          </div>
        )}

        {/* Header & Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 transition">Home</Link>
            <span>/</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Shop Catalog</span>
          </nav>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Additive Production Catalog
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-gray-900 dark:text-white leading-[1.08]">
              Precision <span className="apple-gold-gradient">3D Prints</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl font-normal leading-relaxed">
              Precision printed on tuned additive manufacturing hardware using high-grade filaments up to 160mm build volume.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold shrink-0 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>⚡ Pan-India Express Delivery: 40+ Cities Covered</span>
            </div>
          </div>
        </div>

        {/* Search Query Pill */}
        {searchQuery && (
          <div className="mb-6 flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm max-w-fit shadow-sm">
            <span className="text-gray-600 dark:text-gray-400">Search results for:</span>
            <span className="text-amber-500 font-semibold">"{searchQuery}"</span>
            <button
              onClick={clearSearch}
              className="ml-2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
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
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ease-out active:scale-95 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-gray-950 shadow-md shadow-amber-500/25'
                  : 'bg-white/80 dark:bg-[#0b0f17]/80 backdrop-blur border border-gray-200/80 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:border-amber-500/40 hover:text-amber-500 dark:hover:text-white shadow-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No products found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Try clearing your search query or selecting a different category.</p>
            <button
              onClick={() => {
                clearSearch();
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-amber-500 transition"
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
                  className="group rounded-3xl apple-glass apple-card-hover border border-gray-200/80 dark:border-white/[0.08] overflow-hidden hover:border-amber-500/40 transition-all duration-500 ease-apple flex flex-col justify-between shadow-sm hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1 text-gray-900 dark:text-white"
                >
                  <div>
                    <div className="h-56 overflow-hidden bg-gray-100/60 dark:bg-white/[0.02] flex items-center justify-center p-2 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500 ease-apple"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/images/hero_3d_printer_1786179196218.webp';
                        }}
                      />
                      {qtyInCart > 0 && (
                        <span className="absolute top-4 right-4 bg-amber-500 text-gray-950 text-xs font-black px-2.5 py-1 rounded-full shadow-lg shadow-black/40">
                          {qtyInCart} in cart
                        </span>
                      )}

                      {/* 3D Model Badge */}
                      {Boolean(product.stlUrl && product.stlUrl !== 'NA' && product.stlUrl.trim() !== '') && (
                        <button
                          onClick={() => setActive3dProduct(product)}
                          className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 hover:bg-amber-500 hover:text-gray-950 text-amber-500 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-amber-500/40 shadow-lg backdrop-blur flex items-center gap-1.5 transition-all duration-300 ease-apple"
                          title="Open Interactive 3D Model View"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          3D View
                        </button>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="text-xs font-semibold text-amber-500 mb-1">{product.category}</div>
                      <h3 className="font-bold font-display text-lg text-gray-900 dark:text-white mb-1.5">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">{product.description}</p>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Dimensions: {product.dimensions}</div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between mt-4">
                    <span className="text-xl font-extrabold text-amber-500">₹{product.price}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddToCart(product, false)}
                        title="Add to cart and keep shopping"
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100/80 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-amber-600 dark:text-amber-400 border border-gray-200/80 dark:border-amber-500/30 transition-all duration-300 ease-apple active:scale-95 flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add</span>
                      </button>
                      <button
                        onClick={() => handleAddToCart(product, true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-gray-950 shadow-md shadow-amber-500/20 transition-all duration-300 ease-apple active:scale-95"
                      >
                        Add to Cart &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3D Model Inspection Modal */}
        {active3dProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-amber-500/40 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                    <span className="text-amber-500">⚡</span> {active3dProduct.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{active3dProduct.category} • {active3dProduct.dimensions}</p>
                </div>
                <button
                  onClick={() => setActive3dProduct(null)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-transparent">
                <StlViewer
                  stlUrl={active3dProduct.stlUrl || '/assets/models/sample_dragon.stl'}
                  fileName={active3dProduct.stlUrl || active3dProduct.name}
                  height={380}
                  noBuildLimit={true}
                  allowScaleAdjustment={true}
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-950/80 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xl font-extrabold text-amber-500">₹{active3dProduct.price}</span>
                <button
                  onClick={() => {
                    handleAddToCart(active3dProduct, false);
                    setActive3dProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-gray-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
