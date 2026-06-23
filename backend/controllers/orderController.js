const prisma = require('../prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'dummy_stripe_key');

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
    } else if (paymentMethod === 'STRIPE') {
      // Create Stripe session
      if (!process.env.STRIPE_SECRET_KEY) {
        // Return a simulated success url if Stripe key isn't provided
        console.warn('STRIPE_SECRET_KEY is not defined. Simulating Stripe checkout session...');
        return res.status(201).json({
          success: true,
          paymentMethod: 'STRIPE',
          url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/orders?stripe_mock_success=true&order_id=${order.id}`
        });
      }

      // Build Stripe line items
      const lineItems = order.orderItems.map(item => {
        // Stripe prices are in cents, so multiply dollar values by 100
        const itemPrice = Math.round(item.price * 100);
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product.name,
              description: item.product.description.slice(0, 100),
            },
            unit_amount: itemPrice,
          },
          quantity: item.quantity,
        };
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/orders?payment_success=true&order_id=${order.id}`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/cart?payment_cancelled=true`,
        metadata: {
          orderId: order.id
        }
      });

      return res.json({
        success: true,
        paymentMethod: 'STRIPE',
        url: session.url
      });
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

// @desc    Handle Stripe Webhook Completed Event
// @route   POST /api/orders/stripe-webhook
// @access  Public (Stripe webhook endpoint)
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET is not configured. Webhook ignored.');
    return res.status(400).send('Webhook Secret not configured');
  }

  try {
    // req.body must be raw buffer for Stripe signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the completed checkout session
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { isPaid: true }
      });
      console.log(`Payment confirmed and order ${orderId} updated to paid!`);
    } catch (dbError) {
      console.error(`Database update error for order ${orderId}: ${dbError.message}`);
      return res.status(500).send('Database error updating order payment state');
    }
  }

  res.json({ received: true });
};

// @desc    Mock Stripe payment webhook completion (for local development testing)
// @route   POST /api/orders/mock-pay/:id
// @access  Public
const mockStripePayment = async (req, res) => {
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
  handleStripeWebhook,
  mockStripePayment
};
