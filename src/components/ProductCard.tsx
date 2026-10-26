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
    <div className="group rounded-3xl bg-white dark:bg-[#0b0f17] border border-gray-200/80 dark:border-white/[0.08] overflow-hidden hover:border-amber-500/40 transition-all duration-500 ease-out flex flex-col justify-between shadow-sm hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 relative">
      {isAdmin && isEditorMode && (
        <div className="absolute top-3.5 right-3.5 z-10">
          <Link
            to={`/admin?tab=products&edit=${id}`}
            className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-[11px] shadow-md flex items-center gap-1 transition backdrop-blur"
            title="Edit product listing in Admin"
          >
            <span>✏️</span> Edit
          </Link>
        </div>
      )}
      <Link to="/shop" className="block focus:outline-none flex-1">
        <div className="h-52 overflow-hidden bg-gray-50/50 dark:bg-black/30 flex items-center justify-center p-3 relative">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        </div>
        <div className="p-5">
          {category && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">{category}</div>
          )}
          <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1.5 tracking-tight group-hover:text-amber-500 transition-colors duration-300">{name}</h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{description}</p>
          )}
        </div>
      </Link>
      <div className="p-5 pt-0 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between mt-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-gray-400">Price</span>
          <span className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">₹{price}</span>
        </div>
        <div className="flex items-center gap-2">
          {onAddToCart ? (
            <button
              onClick={onAddToCart}
              className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-105 active:scale-95 text-gray-950 shadow-md shadow-amber-500/20 transition-all duration-300 ease-out"
            >
              Add to Cart
            </button>
          ) : (
            <Link
              to="/shop"
              className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-105 active:scale-95 text-gray-950 shadow-md shadow-amber-500/20 transition-all duration-300 ease-out"
            >
              Shop Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
