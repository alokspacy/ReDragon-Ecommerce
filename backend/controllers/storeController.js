const prisma = require('../prisma/client');

// @desc    Register/Create a store
// @route   POST /api/stores
// @access  Private
const createStore = async (req, res) => {
  const { name, username, description, email, contact, address } = req.body;

  try {
    // Check if user already has a store
    const existingStore = await prisma.store.findUnique({
      where: { userId: req.user.id }
    });

    if (existingStore) {
      return res.status(400).json({ message: 'You have already registered a store' });
    }

    // Check if username is taken
    const usernameTaken = await prisma.store.findUnique({
      where: { username }
    });

    if (usernameTaken) {
      return res.status(400).json({ message: 'Store username is already taken' });
    }

    // Process logo upload
    let logo = '/uploads/happy_store.webp'; // Default logo fallback
    if (req.file) {
      logo = `/uploads/${req.file.filename}`;
    }

    const store = await prisma.store.create({
      data: {
        userId: req.user.id,
        name,
        username,
        description,
        email,
        contact,
        address,
        logo,
        status: 'pending',
        isActive: false
      }
    });

    res.status(201).json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error registering store' });
  }
};

// @desc    Get store status for current user
// @route   GET /api/stores/status
// @access  Private
const getStoreStatus = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { userId: req.user.id }
    });

    if (!store) {
      return res.json({ registered: false });
    }

    res.json({
      registered: true,
      id: store.id,
      name: store.name,
      username: store.username,
      status: store.status,
      isActive: store.isActive,
      message: store.status === 'pending'
        ? 'Your store is pending verification. Please wait for admin approval.'
        : store.status === 'approved'
        ? 'Your store is active!'
        : 'Your store application was rejected.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking store status' });
  }
};

// @desc    Get current user's store details
// @route   GET /api/stores/my-store
// @access  Private
const getMyStore = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { userId: req.user.id },
      include: {
        Product: true
      }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching store details' });
  }
};

// @desc    Get all stores
// @route   GET /api/stores
// @access  Private (Admin only)
const getStores = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
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

    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching stores' });
  }
};

// @desc    Approve or reject a store
// @route   PUT /api/stores/:id/approve
// @access  Private (Admin only)
const approveStore = async (req, res) => {
  const { status } = req.body; // should be 'approved' or 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const updatedStore = await prisma.store.update({
      where: { id: req.params.id },
      data: {
        status,
        isActive: status === 'approved'
      }
    });

    res.json(updatedStore);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating store status' });
  }
};

// @desc    Get dashboard statistics for a seller
// @route   GET /api/stores/dashboard
// @access  Private
const getSellerDashboard = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { userId: req.user.id }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Total products count
    const totalProducts = await prisma.product.count({
      where: { storeId: store.id }
    });

    // Total orders count associated with store
    const totalOrders = await prisma.order.count({
      where: { storeId: store.id }
    });

    // Total earnings (sum of paid orders)
    const paidOrders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        isPaid: true
      },
      select: {
        total: true
      }
    });
    const totalEarnings = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // List of ratings/reviews for products in this store
    const ratings = await prisma.rating.findMany({
      where: {
        product: {
          storeId: store.id
        }
      },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      totalProducts,
      totalEarnings,
      totalOrders,
      ratings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching dashboard metrics' });
  }
};

// @desc    Get store by username publicly
// @route   GET /api/stores/public/:username
// @access  Public
const getPublicStore = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { username: req.params.username },
      include: {
        Product: {
          where: { inStock: true }
        }
      }
    });

    if (!store || !store.isActive) {
      return res.status(404).json({ message: 'Store not found or is inactive' });
    }

    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching store' });
  }
};

module.exports = {
  createStore,
  getStoreStatus,
  getMyStore,
  getStores,
  approveStore,
  getSellerDashboard,
  getPublicStore
};
