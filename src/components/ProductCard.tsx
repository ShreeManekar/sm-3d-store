import React from 'react';
import { Link } from 'react-router-dom';

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
  name,
  price,
  imageUrl,
  category,
  description,
  onAddToCart,
}) => (
  <div className="group rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-cyan-500/50 transition duration-300 flex flex-col justify-between">
    <div>
      <div className="h-48 overflow-hidden bg-gray-950 flex items-center justify-center p-2">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        {category && (
          <div className="text-xs font-semibold text-cyan-400 mb-1">{category}</div>
        )}
        <h3 className="font-bold text-white mb-1">{name}</h3>
        {description && (
          <p className="text-sm text-gray-400 mb-3">{description}</p>
        )}
      </div>
    </div>
    <div className="p-4 pt-0 border-t border-gray-800/80 flex items-center justify-between mt-3">
      <span className="text-lg font-bold text-cyan-400">₹{price}</span>
      <div className="flex items-center gap-2">
        <Link
          to="/shop"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition"
        >
          Details
        </Link>
        {onAddToCart ? (
          <button
            onClick={onAddToCart}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition"
          >
            Add to Cart
          </button>
        ) : (
          <Link
            to="/shop"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition"
          >
            Shop Now
          </Link>
        )}
      </div>
    </div>
  </div>
);
