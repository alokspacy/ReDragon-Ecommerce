const prisma = require('../prisma/client');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private (Admin only)
const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching coupons' });
  }
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private (Admin only)
const createCoupon = async (req, res) => {
  const { code, description, discount, forNewUser, forMember, isPublic, expiresAt } = req.body;

  if (!code || !discount || !expiresAt) {
    return res.status(400).json({ message: 'Please provide code, discount, and expiry date' });
  }

  try {
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description: description || '',
        discount: parseFloat(discount),
        forNewUser: forNewUser === true || forNewUser === 'true',
        forMember: forMember === true || forMember === 'true',
        isPublic: isPublic === true || isPublic === 'true',
        expiresAt: new Date(expiresAt)
      }
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating coupon' });
  }
};

// @desc    Validate a coupon code
// @route   GET /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Please provide a coupon code' });
  }

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon code not found' });
    }

    // Check expiry
    const now = new Date();
    if (now > new Date(coupon.expiresAt)) {
      return res.status(400).json({ message: 'Coupon code has expired' });
    }

    // If check for new user is required:
    if (coupon.forNewUser) {
      // Check if user has any previous orders
      const previousOrdersCount = await prisma.order.count({
        where: { userId: req.user.id }
      });

      if (previousOrdersCount > 0) {
        return res.status(400).json({ message: 'This coupon is only valid for your first order' });
      }
    }

    res.json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error validating coupon' });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:code
// @access  Private (Admin only)
const deleteCoupon = async (req, res) => {
  try {
    await prisma.coupon.delete({
      where: { code: req.params.code.toUpperCase() }
    });
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting coupon' });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  validateCoupon,
  deleteCoupon
};
