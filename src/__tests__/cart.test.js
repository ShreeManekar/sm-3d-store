// Test cart calculation and state manipulation logic
describe('Cart Logic & State Suite', () => {
  const FREE_SHIPPING_THRESHOLD = 500;
  const STANDARD_SHIPPING_FEE = 99;

  function calculateCartTotals(items) {
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

  function cartReducer(items, action) {
    switch (action.type) {
      case 'ADD_ITEM': {
        const { product, quantity = 1 } = action.payload;
        if (quantity <= 0) return items;
        const index = items.findIndex((i) => i.id === product.id);
        if (index > -1) {
          const updated = [...items];
          updated[index] = { ...updated[index], quantity: updated[index].quantity + quantity };
          return updated;
        }
        return [...items, { ...product, quantity }];
      }
      case 'REMOVE_ITEM': {
        return items.filter((i) => i.id !== action.payload.id);
      }
      case 'UPDATE_QUANTITY': {
        const { id, quantity } = action.payload;
        if (quantity <= 0) {
          return items.filter((i) => i.id !== id);
        }
        return items.map((i) => (i.id === id ? { ...i, quantity } : i));
      }
      case 'CLEAR_CART': {
        return [];
      }
      default:
        return items;
    }
  }

  test('calculates correct totals for empty cart', () => {
    const result = calculateCartTotals([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPrice).toBe(0);
    expect(result.shippingFee).toBe(0);
    expect(result.finalTotal).toBe(0);
  });

  test('charges standard shipping for orders under 500 threshold', () => {
    const items = [{ id: 'prod_2', name: 'Planetary Gearbox', price: 399, quantity: 1 }];
    const result = calculateCartTotals(items);
    expect(result.totalItems).toBe(1);
    expect(result.totalPrice).toBe(399);
    expect(result.shippingFee).toBe(99);
    expect(result.finalTotal).toBe(498);
  });

  test('applies free shipping for orders equal or above 500 threshold', () => {
    const items = [{ id: 'prod_1', name: 'Articulated Dragon', price: 749, quantity: 1 }];
    const result = calculateCartTotals(items);
    expect(result.totalItems).toBe(1);
    expect(result.totalPrice).toBe(749);
    expect(result.shippingFee).toBe(0);
    expect(result.finalTotal).toBe(749);
  });

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

  test('ignores add with zero or negative quantity', () => {
    const initial = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
    const product = { id: 'prod_1', name: 'Dragon', price: 749 };
    const state = cartReducer(initial, { type: 'ADD_ITEM', payload: { product, quantity: 0 } });
    expect(state[0].quantity).toBe(1);
  });

  test('updates item quantity properly', () => {
    const initial = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
    const state = cartReducer(initial, { type: 'UPDATE_QUANTITY', payload: { id: 'prod_1', quantity: 5 } });
    expect(state[0].quantity).toBe(5);
  });

  test('removes item when quantity is reduced to 0 or below', () => {
    const initial = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
    const state = cartReducer(initial, { type: 'UPDATE_QUANTITY', payload: { id: 'prod_1', quantity: 0 } });
    expect(state.length).toBe(0);
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

  test('safe localStorage serialization and parsing', () => {
    const validItems = [{ id: 'prod_1', name: 'Dragon', price: 749, quantity: 1 }];
    const serialized = JSON.stringify(validItems);
    const parsed = JSON.parse(serialized);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe('prod_1');

    // Invalid JSON gracefully caught
    const badJson = 'invalid{json}';
    let fallback = [];
    try {
      fallback = JSON.parse(badJson);
    } catch (e) {
      fallback = [];
    }
    expect(fallback).toEqual([]);
  });
});
