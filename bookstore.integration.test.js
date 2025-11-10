import {
  searchBooks,
  addToCart,
  calculateTotal,
  setPaymentMock,
  updateInventory,
  completePurchase,
  applyDiscount,
} from './bookstore.js';

import { jest } from '@jest/globals';

describe('Bookstore Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPaymentMock(() => ({
      success: true,
      transactionId: 'TXN-000',
      paymentMethod: 'credit-card',
      amount: 0,
    }));
  });

  describe('Successful Purchase Flow', () => {
    test('should complete entire purchase process successfully', () => {
      const result = completePurchase('Eloquent', 1, 2, 'credit-card');

      expect(result).toHaveProperty('orderId');
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.message).toBe('Purchase completed successfully!');
    });

    test('should handle multiple books in cart', () => {
      addToCart(1, 1);
      addToCart(2, 2);

      const total = calculateTotal([
        { id: 1, price: 32, quantity: 1 },
        { id: 2, price: 40, quantity: 2 },
      ]);

      expect(total).toBeCloseTo((32 * 1 + 40 * 2) * 1.1);
    });

    // test('should reset cart after successful purchase', () => {
    //   completePurchase('Star Wars', 2, 1, 'paypal');
    //   const result = addToCart(3, 1);
    //   expect(result.length).toBe(1);
    //   expect(result[0].id).toBe(3);
    // });
  });

  describe('Error Handling', () => {
    test('should fail when book is out of stock', () => {
      expect(() => addToCart(1, 999)).toThrow('Not enough stock');
    });

    test('should handle payment failure gracefully', () => {
      setPaymentMock(() => ({ success: false }));

      const result = completePurchase('Eloquent', 1, 1, 'credit-card');
      expect(result.error).toBe('Payment failed');
    });

    test('should not update inventory if payment fails', () => {
      const before = searchBooks('Pettson')[0].stock;

      const mockPayment = jest.fn(() => ({ success: false }));
      const total = 28 * 2;
      const payment = mockPayment(total, 'card');
      expect(payment.success).toBe(false);

      const after = searchBooks('Pettson')[0].stock;
      expect(after).toBe(before);
    });
  });

  describe('Advanced Features', () => {
    test('should apply coupon discount correctly', () => {
      setPaymentMock(() => ({
        success: true,
        transactionId: 'TXN-999',
        paymentMethod: 'credit-card',
        amount: 0,
      }));

      const result = completePurchase(
        'Star Wars',
        2,
        2,
        'credit-card',
        'SAVE10'
      );

      const expectedTotal = applyDiscount(
        calculateTotal([{ id: 2, price: 40, quantity: 2 }]),
        'SAVE10'
      );

      expect(result.total).toBeCloseTo(expectedTotal);
      expect(result.message).toBe('Purchase completed successfully!');
    });

    test('should generate low stock alerts when stock <= 2', () => {
      addToCart(2, 3);

      setPaymentMock(() => ({
        success: true,
        transactionId: 'TXN-888',
        paymentMethod: 'credit-card',
        amount: 0,
      }));

      const result = completePurchase('Star Wars', 2, 3, 'credit-card');
      expect(result.lowStockAlerts).toContain(
        'Star Wars stock is low (2 left)'
      );
    });
  });
});
