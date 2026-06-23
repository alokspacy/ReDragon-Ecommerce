const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'redragon_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine role - default to admin if email is admin@redragon.com
    const role = email.toLowerCase() === 'admin@redragon.com' ? 'admin' : 'user';

    // Default user image
    const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EF4444&color=fff`;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        image: defaultImage,
        role,
        cart: {},
      },
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        cart: user.cart,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        cart: user.cart,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Sync cart items
// @route   PUT /api/auth/cart
// @access  Private
const updateCart = async (req, res) => {
  const { cart } = req.body; // should be a JSON object like { "productId": quantity }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { cart: cart || {} },
    });

    res.json({ cart: updatedUser.cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error syncing cart' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateCart,
};
