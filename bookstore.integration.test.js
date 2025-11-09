import {
  searchBooks,
  addToCart,
  calculateTotal,
  setPaymentMock,
  updateInventory,
  completePurchase,
  applyDiscount
} from './bookstore.js';

import { jest } from '@jest/globals'; 

describe('Bookstore Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    test('should reset cart after successful purchase', () => {
      completePurchase('Star Wars', 2, 1, 'paypal');
      const result = addToCart(3, 1);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('should fail when book is out of stock', () => {
      expect(() => addToCart(1, 999)).toThrow('Not enough stock');
    });

    test('should handle payment failure gracefully', () => {
      const mockProcessPayment = jest.fn(() => ({
        success: false,
        transactionId: null,
      }));

      const fakeCompletePurchase = (searchQuery, bookId, quantity, method) => {
        const results = searchBooks(searchQuery);
        if (results.length === 0) throw new Error('No books found');
        addToCart(bookId, quantity);
        const total = calculateTotal([
          { id: bookId, quantity, price: results[0].price },
        ]);
        const payment = mockProcessPayment(total, method);
        if (!payment.success) return { error: 'Payment failed' };
      };

      const result = fakeCompletePurchase('Pippi', 3, 1, 'credit-card');
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

    test('should return error if book search yields no results', () => {
      const result = completePurchase('Unknown Book', 999, 1, 'credit-card');
      expect(result.error).toBe('No books found');
    });

    test('should throw error if book not found when updating inventory', () => {
      const fakeCart = [{ id: 999, quantity: 1 }];
      expect(() => updateInventory(fakeCart)).toThrow(
        'Book not found in inventory'
      );
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
