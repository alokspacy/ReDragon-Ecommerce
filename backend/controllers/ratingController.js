const prisma = require('../prisma/client');

// @desc    Add rating/review to a product
// @route   POST /api/ratings
// @access  Private
const addProductRating = async (req, res) => {
  const { rating, review, productId, orderId } = req.body;

  if (!rating || !productId || !orderId) {
    return res.status(400).json({ message: 'Please provide rating, productId, and orderId' });
  }

  try {
    // Verify that the order exists, belongs to user, and includes the product
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id
      },
      include: {
        orderItems: true
      }
    });

    if (!order) {
      return res.status(400).json({ message: 'Order not found or does not belong to you' });
    }

    const hasProduct = order.orderItems.some(item => item.productId === productId);
    if (!hasProduct) {
      return res.status(400).json({ message: 'Product was not purchased in this order' });
    }

    // Check if user already rated this product for this order
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_productId_orderId: {
          userId: req.user.id,
          productId,
          orderId
        }
      }
    });

    if (existingRating) {
      return res.status(400).json({ message: 'You have already reviewed this product for this order' });
    }

    const ratingRecord = await prisma.rating.create({
      data: {
        rating: parseInt(rating),
        review: review || '',
        userId: req.user.id,
        productId,
        orderId
      },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      }
    });

    res.status(201).json(ratingRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error posting review' });
  }
};

// @desc    Get ratings for a product
// @route   GET /api/ratings/product/:productId
// @access  Public
const getProductRatings = async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { productId: req.params.productId },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching ratings' });
  }
};

module.exports = {
  addProductRating,
  getProductRatings
};
