import React from 'react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ id, name, price, imageUrl }) => (
  <div className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
    <img src={imageUrl} alt={name} className="w-full h-48 object-cover mb-2" />
    <h3 className="text-lg font-semibold mb-1">{name}</h3>
    <p className="text-gray-700 mb-2">${price.toFixed(2)}</p>
    <Link
      to={`/shop/${id}`}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      View Details
    </Link>
  </div>
);
