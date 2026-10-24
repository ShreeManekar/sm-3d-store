import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image: string;
  dimensions?: string;
}

export interface CartItem extends ProductItem {
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductItem, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  shippingFee: number;
  freeShippingThreshold: number;
  finalTotal: number;
}

export const CART_STORAGE_KEY = 'sm3d_cart_items';
export const FREE_SHIPPING_THRESHOLD = 500;
export const STANDARD_SHIPPING_FEE = 99;

export function calculateCartTotals(items: CartItem[]): {
  totalItems: number;
  totalPrice: number;
  shippingFee: number;
  finalTotal: number;
} {
  const totalItems = items.reduce((sum, item) => sum + (item.quantity > 0 ? item.quantity : 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.quantity > 0 ? item.price * item.quantity : 0), 0);
  const shippingFee = totalPrice === 0 || totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = totalPrice + shippingFee;

  return {
    totalItems,
    totalPrice,
    shippingFee,
    finalTotal,
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item.id === 'string' && typeof item.price === 'number');
        }
      }
    } catch (e) {
      console.warn('Failed to parse cart items from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart items to localStorage:', e);
    }
  }, [items]);

  const addToCart = (product: ProductItem, quantity: number = 1) => {
    if (quantity <= 0) return;
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const { totalItems, totalPrice, shippingFee, finalTotal } = calculateCartTotals(items);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        shippingFee,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
