const prisma = require('../prisma/client');

// @desc    Get user addresses
// @route   GET /api/address
// @access  Private
const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching addresses' });
  }
};

// @desc    Add shipping address
// @route   POST /api/address
// @access  Private
const addAddress = async (req, res) => {
  const { name, email, street, city, state, zip, country, phone } = req.body;

  if (!name || !email || !street || !city || !state || !zip || !country || !phone) {
    return res.status(400).json({ message: 'Please provide all shipping fields' });
  }

  try {
    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        name,
        email,
        street,
        city,
        state,
        zip,
        country,
        phone
      }
    });

    res.status(201).json(address);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving address' });
  }
};

// @desc    Delete shipping address
// @route   DELETE /api/address/:id
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const address = await prisma.address.findUnique({
      where: { id: req.params.id }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (address.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this address' });
    }

    await prisma.address.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting address' });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  deleteAddress
};
