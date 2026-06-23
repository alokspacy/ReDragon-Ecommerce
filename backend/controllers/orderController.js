const prisma = require('../prisma/client');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance if keys are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// @desc    Create a new order (COD or Stripe checkout)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const { total, storeId, addressId, paymentMethod, isCouponUsed, coupon, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in order' });
  }

  try {
    // 1. Create order in Database (unpaid by default)
    const order = await prisma.order.create({
      data: {
        total: parseFloat(total),
        userId: req.user.id,
        storeId,
        addressId,
        paymentMethod,
        isPaid: false,
        isCouponUsed: isCouponUsed || false,
        coupon: coupon ? JSON.parse(JSON.stringify(coupon)) : {},
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price)
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        address: true
      }
    });

    // 2. Handle payment method routing
    if (paymentMethod === 'COD') {
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully using COD',
        orderId: order.id,
        paymentMethod: 'COD'
      });
    } else if (paymentMethod === 'RAZORPAY') {
      // Create Razorpay Order
      if (!razorpay) {
        // Return a simulated success response if Razorpay key isn't provided
        console.warn('RAZORPAY_KEY_ID is not defined. Simulating Razorpay order creation...');
        return res.status(201).json({
          success: true,
          paymentMethod: 'RAZORPAY',
          isMock: true,
          orderId: order.id,
          amount: Math.round(order.total * 100),
          currency: 'USD'
        });
      }

      const amountInCents = Math.round(order.total * 100);

      const options = {
        amount: amountInCents,
        currency: 'USD',
        receipt: `receipt_${order.id}`,
        notes: {
          orderId: order.id
        }
      };

      try {
        const razorpayOrder = await razorpay.orders.create(options);
        return res.status(201).json({
          success: true,
          paymentMethod: 'RAZORPAY',
          isMock: false,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          orderId: order.id
        });
      } catch (err) {
        console.error('Razorpay order creation error:', err);
        return res.status(500).json({ message: 'Razorpay order creation failed' });
      }
    }

    res.status(400).json({ message: 'Invalid payment method' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error placing order' });
  }
};

// @desc    Get user's buyer orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        address: true,
        store: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// @desc    Get store's seller orders
// @route   GET /api/orders/store
// @access  Private
const getStoreOrders = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { userId: req.user.id }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        address: true,
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching store orders' });
  }
};

// @desc    Update order fulfillment status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  const { status } = req.body; // ORDER_PLACED, PROCESSING, SHIPPED, DELIVERED

  if (!['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid order status' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { store: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check ownership of the store selling the products, or admin role
    if (order.store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update status' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

// @desc    Get admin statistics dashboard
// @route   GET /api/orders/admin-dashboard
// @access  Private (Admin only)
const getAdminDashboard = async (req, res) => {
  try {
    const ordersCount = await prisma.order.count();
    const storesCount = await prisma.store.count({
      where: { status: 'approved' }
    });
    const productsCount = await prisma.product.count();

    // System-wide total earnings from paid orders
    const paidOrders = await prisma.order.findMany({
      where: { isPaid: true },
      select: { total: true }
    });
    const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2);

    // List of all orders for revenue chart rendering (latest 30 orders)
    const allOrders = await prisma.order.findMany({
      select: {
        createdAt: true,
        total: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 50
    });

    res.json({
      orders: ordersCount,
      stores: storesCount,
      products: productsCount,
      revenue,
      allOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching admin dashboard stats' });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/orders/verify-razorpay
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: 'Missing required Razorpay payment verification parameters' });
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    // Update order status to paid
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { isPaid: true }
    });

    res.json({ success: true, message: 'Payment verified and order confirmed successfully!', order: updatedOrder });
  } catch (error) {
    console.error('Razorpay signature verification failed:', error);
    res.status(500).json({ message: 'Server error verifying Razorpay payment' });
  }
};

// @desc    Mock Razorpay payment completion (for local development testing)
// @route   POST /api/orders/mock-pay/:id
// @access  Public
const mockRazorpayPayment = async (req, res) => {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { isPaid: true }
    });
    res.json({ success: true, message: 'Order payment simulated successfully!', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to simulate payment' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getStoreOrders,
  updateOrderStatus,
  getAdminDashboard,
  verifyRazorpayPayment,
  mockRazorpayPayment
};
