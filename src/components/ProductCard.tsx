import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category?: string;
  description?: string;
  onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  imageUrl,
  category,
  description,
  onAddToCart,
}) => {
  const { isAdmin, isEditorMode } = useAuth();

  return (
    <div className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-amber-500/50 transition duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-black/40 relative">
      {isAdmin && isEditorMode && (
        <div className="absolute top-3 right-3 z-10">
          <Link
            to={`/admin?tab=products&edit=${id}`}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-gray-950 font-bold text-[11px] shadow-md flex items-center gap-1 transition backdrop-blur"
            title="Edit product listing in Admin"
          >
            <span>✏️</span> Edit
          </Link>
        </div>
      )}
      <Link to="/shop" className="block focus:outline-none">
        <div className="h-48 overflow-hidden bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-2">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        </div>
        <div className="p-4">
          {category && (
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">{category}</div>
          )}
          <h3 className="font-bold text-gray-900 dark:text-white mb-1 hover:text-amber-600 dark:hover:text-amber-400 transition">{name}</h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{description}</p>
          )}
        </div>
      </Link>
      <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between mt-3">
        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{price}</span>
        <div className="flex items-center gap-2">
          <Link
            to="/shop"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            Details
          </Link>
          {onAddToCart ? (
            <button
              onClick={onAddToCart}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold shadow-md shadow-amber-500/20 transition"
            >
              Add to Cart
            </button>
          ) : (
            <Link
              to="/shop"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold shadow-md shadow-amber-500/20 transition"
            >
              Shop Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
