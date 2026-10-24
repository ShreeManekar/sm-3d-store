import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartLogic from './cartLogic.cjs';

const {
  CART_STORAGE_KEY,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  calculateCartTotals,
  sanitizeCartItems,
  cartReducer,
} = cartLogic;

export { CART_STORAGE_KEY, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, calculateCartTotals };

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

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return sanitizeCartItems(parsed) as CartItem[];
      }
    } catch (e) {
      console.warn('Failed to parse cart items from localStorage:', e);
    }
    return [];
  });

  // Persist to localStorage whenever cart items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart items to localStorage:', e);
    }
  }, [items]);

  // Sync state across browser tabs via storage event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const remoteItems = JSON.parse(e.newValue);
          setItems(sanitizeCartItems(remoteItems) as CartItem[]);
        } catch (err) {
          console.warn('Error syncing cart across tabs:', err);
        }
      } else if (e.key === CART_STORAGE_KEY && !e.newValue) {
        setItems([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addToCart = useCallback((product: ProductItem, quantity: number = 1) => {
    setItems((prevItems) =>
      cartReducer(prevItems, {
        type: 'ADD_ITEM',
        payload: { product, quantity },
      }) as CartItem[]
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prevItems) =>
      cartReducer(prevItems, {
        type: 'REMOVE_ITEM',
        payload: { id },
      }) as CartItem[]
    );
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prevItems) =>
      cartReducer(prevItems, {
        type: 'UPDATE_QUANTITY',
        payload: { id, quantity },
      }) as CartItem[]
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems((prevItems) => cartReducer(prevItems, { type: 'CLEAR_CART' }) as CartItem[]);
  }, []);

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
