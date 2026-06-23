const prisma = require('../prisma/client');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const { search, category, storeId } = req.query;

  try {
    const whereClause = {};

    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        },
        rating: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        store: true,
        rating: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Seller only)
const createProduct = async (req, res) => {
  const { name, description, mrp, price, category } = req.body;

  try {
    // Find store owned by user
    const store = await prisma.store.findUnique({
      where: { userId: req.user.id }
    });

    if (!store) {
      return res.status(400).json({ message: 'User does not have a store registered' });
    }

    if (store.status !== 'approved') {
      return res.status(403).json({ message: 'Your store must be approved by admin to list products' });
    }

    // Process files uploaded from multer
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      // Fallback if client sends image URLs
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // Default image if none provided
    if (images.length === 0) {
      images = ['/uploads/placeholder.png'];
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        mrp: parseFloat(mrp),
        price: parseFloat(price),
        category,
        images,
        storeId: store.id
      },
      include: {
        store: true
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller owner only)
const updateProduct = async (req, res) => {
  const { name, description, mrp, price, category, inStock } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { store: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    // Process new images if uploaded
    let images = product.images;
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: name || product.name,
        description: description || product.description,
        mrp: mrp ? parseFloat(mrp) : product.mrp,
        price: price ? parseFloat(price) : product.price,
        category: category || product.category,
        inStock: inStock !== undefined ? inStock === 'true' || inStock === true : product.inStock,
        images
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller owner or Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { store: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership or admin
    if (product.store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
