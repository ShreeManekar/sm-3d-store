const CART_STORAGE_KEY = 'sm3d_cart_items';
const FREE_SHIPPING_THRESHOLD = 500;
const STANDARD_SHIPPING_FEE = 99;

function isValidItem(item) {
  return (
    item &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    Number.isFinite(item.price) &&
    item.price >= 0
  );
}

function calculateCartTotals(items) {
  if (!Array.isArray(items)) {
    return { totalItems: 0, totalPrice: 0, shippingFee: 0, finalTotal: 0 };
  }
  const totalItems = items.reduce(
    (sum, item) => sum + (isValidItem(item) ? Math.floor(item.quantity) : 0),
    0
  );
  const totalPrice = items.reduce(
    (sum, item) => sum + (isValidItem(item) ? Math.floor(item.quantity) * item.price : 0),
    0
  );
  const shippingFee = totalPrice === 0 || totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = totalPrice + shippingFee;

  return {
    totalItems,
    totalPrice,
    shippingFee,
    finalTotal,
  };
}

function sanitizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        item.id.trim() !== '' &&
        typeof item.name === 'string' &&
        isValidItem(item)
    )
    .map((item) => ({
      ...item,
      quantity: Math.floor(item.quantity),
    }));
}

function cartReducer(items, action) {
  const currentItems = Array.isArray(items) ? items : [];
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload || {};
      const validQty = Math.floor(quantity);
      if (!product || !product.id || isNaN(validQty) || validQty <= 0) return currentItems;
      const index = currentItems.findIndex((i) => i.id === product.id);
      if (index > -1) {
        const updated = [...currentItems];
        updated[index] = {
          ...updated[index],
          ...product,
          quantity: updated[index].quantity + validQty,
        };
        return updated;
      }
      return [...currentItems, { ...product, quantity: validQty }];
    }
    case 'REMOVE_ITEM': {
      const id = action.payload?.id;
      return currentItems.filter((i) => i.id !== id);
    }
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload || {};
      const validQty = Math.floor(quantity);
      if (!id) return currentItems;
      if (isNaN(validQty) || validQty <= 0) {
        return currentItems.filter((i) => i.id !== id);
      }
      return currentItems.map((i) => (i.id === id ? { ...i, quantity: validQty } : i));
    }
    case 'CLEAR_CART': {
      return [];
    }
    default:
      return currentItems;
  }
}

module.exports = {
  CART_STORAGE_KEY,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  calculateCartTotals,
  sanitizeCartItems,
  cartReducer,
};
