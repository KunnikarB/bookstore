const books = [
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
  {
    id: 5,
    title: 'The Godfather',
    author: 'Mark Seal',
    price: 30,
    stock: 9,
  },
];

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

// Process payment simulation with random success/failure
const processPayment = (cartTotal, paymentMethod) => {
  const success = Math.random() > 0.2;
  const transactionId = success
    ? `TXN-${Math.floor(Math.random() * 1000)}`
    : null;

  return { success, transactionId, paymentMethod, amount: cartTotal };
};

// reduce stock based on cart contents
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

// --- DISCOUNT SYSTEM ---
const coupons = {
  SAVE10: 0.1,  
  SAVE20: 0.2,  
};

const applyDiscount = (total, couponCode) => {
  if (!couponCode) return total;
  const discount = coupons[couponCode.toUpperCase()] || 0;
  return parseFloat((total * (1 - discount)).toFixed(2));
};


// --- MAIN INTEGRATION FUNCTION ---

const completePurchase = (searchQuery, bookId, quantity, paymentMethod, couponCode) => {
  try {
    // 1. Search for books
    const results = searchBooks(searchQuery);
    if (results.length === 0) throw new Error('No books found');

    // 2. Add to cart
    const updatedCart = addToCart(bookId, quantity);

    // 3. Calculate total
    const total = calculateTotal(updatedCart);
    // Apply discount if coupon code is provided
    total = applyDiscount(total, couponCode);

    // 4. Process payment
    const payment = processPayment(total, paymentMethod);
    if (!payment.success) throw new Error('Payment failed');

    // 5. Update inventory
    updateInventory(updatedCart);

    // --- INVENTORY ALERTS ---
    const lowStockAlerts = updatedCart
      .filter((item) => item.stock <= 2)
      .map((item) => `${item.title} stock is low (${item.stock} left)`);

    // 6. Return order confirmation
    const order = {
      orderId: payment.transactionId,
      items: updatedCart,
      total,
      paymentMethod,
      message: 'Purchase completed successfully!',
    };

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
  updateInventory,
  completePurchase,
};



