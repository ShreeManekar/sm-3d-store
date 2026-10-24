const {
  CART_STORAGE_KEY,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  calculateCartTotals,
  sanitizeCartItems,
  cartReducer,
} = require('../context/cartLogic.cjs');

describe('Cart Logic & State Suite', () => {
  describe('calculateCartTotals', () => {
    test('calculates correct totals for empty cart', () => {
      const result = calculateCartTotals([]);
      expect(result.totalItems).toBe(0);
      expect(result.totalPrice).toBe(0);
      expect(result.shippingFee).toBe(0);
      expect(result.finalTotal).toBe(0);
    });

    test('handles non-array or null input gracefully', () => {
      expect(calculateCartTotals(null)).toEqual({ totalItems: 0, totalPrice: 0, shippingFee: 0, finalTotal: 0 });
      expect(calculateCartTotals(undefined)).toEqual({ totalItems: 0, totalPrice: 0, shippingFee: 0, finalTotal: 0 });
      expect(calculateCartTotals('invalid')).toEqual({ totalItems: 0, totalPrice: 0, shippingFee: 0, finalTotal: 0 });
    });

    test('charges standard shipping for orders under 500 threshold', () => {
      const items = [{ id: 'prod_2', name: 'Planetary Gearbox', price: 399, quantity: 1 }];
      const result = calculateCartTotals(items);
      expect(result.totalItems).toBe(1);
      expect(result.totalPrice).toBe(399);
      expect(result.shippingFee).toBe(STANDARD_SHIPPING_FEE);
      expect(result.finalTotal).toBe(498);
    });

    test('charges standard shipping at boundary 499', () => {
      const items = [{ id: 'prod_test', name: 'Item', price: 499, quantity: 1 }];
      const result = calculateCartTotals(items);
      expect(result.shippingFee).toBe(STANDARD_SHIPPING_FEE);
      expect(result.finalTotal).toBe(598);
    });

    test('applies free shipping for orders exactly equal to 500 threshold', () => {
      const items = [{ id: 'prod_test', name: 'Item', price: 500, quantity: 1 }];
      const result = calculateCartTotals(items);
      expect(result.shippingFee).toBe(0);
      expect(result.finalTotal).toBe(500);
    });

    test('applies free shipping for orders above 500 threshold', () => {
      const items = [{ id: 'prod_1', name: 'Articulated Dragon', price: 749, quantity: 1 }];
      const result = calculateCartTotals(items);
      expect(result.totalItems).toBe(1);
      expect(result.totalPrice).toBe(749);
      expect(result.shippingFee).toBe(0);
      expect(result.finalTotal).toBe(749);
    });

    test('ignores items with invalid or negative quantities and prices', () => {
      const items = [
        { id: 'prod_1', name: 'Valid', price: 100, quantity: 2 },
        { id: 'prod_bad_1', name: 'Bad Qty', price: 100, quantity: -2 },
        { id: 'prod_bad_2', name: 'NaN Qty', price: 100, quantity: NaN },
        { id: 'prod_bad_3', name: 'Bad Price', price: -50, quantity: 1 },
      ];
      const result = calculateCartTotals(items);
      expect(result.totalItems).toBe(2);
      expect(result.totalPrice).toBe(200);
      expect(result.shippingFee).toBe(STANDARD_SHIPPING_FEE);
      expect(result.finalTotal).toBe(299);
    });
  });

  describe('sanitizeCartItems', () => {
    test('filters out invalid, corrupted or malicious items from storage', () => {
      const dirty = [
        null,
        undefined,
        {},
        { id: '1' }, // missing name, price, quantity
        { id: '2', name: 'No Price', quantity: 2 },
        { id: '3', name: 'Negative Price', price: -10, quantity: 1 },
        { id: '4', name: 'Zero Qty', price: 100, quantity: 0 },
        { id: '5', name: 'NaN Qty', price: 100, quantity: NaN },
        { id: '6', name: 'Valid Item', price: 299, quantity: 3.8 },
      ];
      const clean = sanitizeCartItems(dirty);
      expect(clean.length).toBe(1);
      expect(clean[0].id).toBe('6');
      expect(clean[0].price).toBe(299);
      expect(clean[0].quantity).toBe(3); // Floored
    });

    test('returns empty array when given non-array', () => {
      expect(sanitizeCartItems('not an array')).toEqual([]);
      expect(sanitizeCartItems(null)).toEqual([]);
    });
  });

  describe('cartReducer', () => {
    test('adds new item to cart', () => {
      const initial = [];
      const product = { id: 'prod_1', name: 'Dragon', price: 749 };
      const state = cartReducer(initial, { type: 'ADD_ITEM', payload: { product, quantity: 1 } });
      expect(state.length).toBe(1);
      expect(state[0].id).toBe('prod_1');
      expect(state[0].quantity).toBe(1);
    });

    test('accumulates quantity when same item is added multiple times', () => {
      const initial = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
      const product = { id: 'prod_1', name: 'Dragon', price: 749 };
      const state = cartReducer(initial, { type: 'ADD_ITEM', payload: { product, quantity: 2 } });
      expect(state.length).toBe(1);
      expect(state[0].quantity).toBe(3);
    });

    test('ignores add with zero, negative or NaN quantity', () => {
      const initial = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
      const product = { id: 'prod_1', name: 'Dragon', price: 749 };
      expect(cartReducer(initial, { type: 'ADD_ITEM', payload: { product, quantity: 0 } })[0].quantity).toBe(1);
      expect(cartReducer(initial, { type: 'ADD_ITEM', payload: { product, quantity: -5 } })[0].quantity).toBe(1);
      expect(cartReducer(initial, { type: 'ADD_ITEM', payload: { product, quantity: NaN } })[0].quantity).toBe(1);
    });

    test('updates item quantity properly', () => {
      const initial = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
      const state = cartReducer(initial, { type: 'UPDATE_QUANTITY', payload: { id: 'prod_1', quantity: 5 } });
      expect(state[0].quantity).toBe(5);
    });

    test('removes item when quantity is reduced to 0, negative, or NaN', () => {
      const initial = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
      expect(cartReducer(initial, { type: 'UPDATE_QUANTITY', payload: { id: 'prod_1', quantity: 0 } }).length).toBe(0);
      expect(cartReducer(initial, { type: 'UPDATE_QUANTITY', payload: { id: 'prod_1', quantity: -2 } }).length).toBe(0);
      expect(cartReducer(initial, { type: 'UPDATE_QUANTITY', payload: { id: 'prod_1', quantity: NaN } }).length).toBe(0);
    });

    test('removes specific item by id', () => {
      const initial = [
        { id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 },
        { id: 'prod_2', name: 'Gearbox', price: 399, quantity: 2 },
      ];
      const state = cartReducer(initial, { type: 'REMOVE_ITEM', payload: { id: 'prod_1' } });
      expect(state.length).toBe(1);
      expect(state[0].id).toBe('prod_2');
    });

    test('clears all items on CLEAR_CART', () => {
      const initial = [
        { id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 },
        { id: 'prod_2', name: 'Gearbox', price: 399, quantity: 2 },
      ];
      const state = cartReducer(initial, { type: 'CLEAR_CART' });
      expect(state.length).toBe(0);
    });

    test('returns unmodified state on unknown action', () => {
      const initial = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
      const state = cartReducer(initial, { type: 'UNKNOWN_ACTION' });
      expect(state).toBe(initial);
    });
  });

  describe('Storage key & constants', () => {
    test('defines expected storage constants', () => {
      expect(CART_STORAGE_KEY).toBe('sm3d_cart_items');
      expect(FREE_SHIPPING_THRESHOLD).toBe(500);
      expect(STANDARD_SHIPPING_FEE).toBe(99);
    });
  });
});
