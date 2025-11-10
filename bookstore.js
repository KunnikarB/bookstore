let initialBooks = [
  {
    id: 1,
    title: 'Eloquent JavaScript',
    author: 'Marijn Haverbeke',
    price: 32,
    stock: 6,
  },
  {
    id: 2,
    title: 'Star Wars',
    author: 'Jonathan Rinzler',
    price: 40,
    stock: 5,
  },
  {
    id: 3,
    title: 'Pippi Långstrump',
    author: 'Astrid Lindgren',
    price: 38,
    stock: 7,
  },
  {
    id: 4,
    title: 'Pettson får julbesök',
    author: 'Sven Nordqvist',
    price: 28,
    stock: 8,
  },
  { id: 5, title: 'The Godfather', author: 'Mark Seal', price: 30, stock: 9 },
];

// we clone this array when resetting
let books = structuredClone(initialBooks);

const searchBooks = (query) => {
  const lowerQuery = query.toLowerCase();
  return books.filter(
    (book) =>
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery)
  );
};

let cart = [];
const addToCart = (bookId, quantity) => {
  const book = books.find((b) => b.id === bookId);
  if (!book) throw new Error('Book not found');
  if (book.stock < quantity) throw new Error('Not enough stock');

  const existingItem = cart.find((item) => item.id === bookId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...book, quantity });
  }

  return cart;
};

const calculateTotal = (cart) => {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalWithTax = subtotal * 1.1;
  return parseFloat(totalWithTax.toFixed(2));
};

let paymentProcessor = (total, method) => {
  const success = Math.random() > 0.2;
  const transactionId = success
    ? `TXN-${Math.floor(Math.random() * 1000)}`
    : null;
  return { success, transactionId, paymentMethod: method, amount: total };
};

const setPaymentMock = (mockFn) => {
  paymentProcessor = mockFn;
};

const updateInventory = (cart) => {
  cart.forEach((item) => {
    const book = books.find((b) => b.id === item.id);
    if (!book) throw new Error('Book not found in inventory');
    if (book.stock < item.quantity)
      throw new Error(`${book.title} is out of stock`);
    book.stock -= item.quantity;
  });
  return books;
};

const coupons = { SAVE10: 0.1, SAVE20: 0.2 };
const applyDiscount = (total, couponCode) => {
  if (!couponCode) return total;
  const discount = coupons[couponCode.toUpperCase()] || 0;
  return parseFloat((total * (1 - discount)).toFixed(2));
};

const completePurchase = (
  searchQuery,
  bookId,
  quantity,
  paymentMethod,
  couponCode
) => {
  try {
    // 🧹 reset everything fresh for each purchase
    books = structuredClone(initialBooks);
    cart = [];

    const results = searchBooks(searchQuery);
    if (results.length === 0) throw new Error('No books found');

    const updatedCart = addToCart(bookId, quantity);

    let total = calculateTotal(updatedCart);
    total = applyDiscount(total, couponCode);

    const payment = paymentProcessor(total, paymentMethod);
    if (!payment.success) throw new Error('Payment failed');

    updateInventory(updatedCart);

    const lowStockAlerts = updatedCart
      .map((item) => {
        const currentBook = books.find((b) => b.id === item.id);
        return currentBook.stock <= 2
          ? `${currentBook.title} stock is low (${currentBook.stock} left)`
          : null;
      })
      .filter(Boolean);

    const order = {
      orderId: payment.transactionId,
      items: updatedCart,
      total,
      paymentMethod,
      message: 'Purchase completed successfully!',
      lowStockAlerts,
    };

    // 🧹 clear cart after purchase
    cart = [];

    return order;
  } catch (error) {
    return { error: error.message };
  }
};

export {
  searchBooks,
  addToCart,
  calculateTotal,
  setPaymentMock,
  updateInventory,
  completePurchase,
  applyDiscount,
};
