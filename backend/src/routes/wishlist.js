const express = require('express');
const router = express.Router();
const { Wishlist, Product, User } = require('../models');
const { auth } = require('../middleware/auth');

// Get all wishlist items for the current user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting wishlist for user:', req.user.id);

    const wishlistItems = await Wishlist.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'author', 'description', 'price', 'sale_price', 'image', 'stock']
        }
      ]
    });

    res.json(wishlistItems);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
});


// Check if a product is in the wishlist
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    console.log('Checking wishlist - User ID:', userId, 'Product ID:', productId);

    const wishlistItem = await Wishlist.findOne({
      where: { user_id: userId, product_id: productId }
    });

    res.json({ inWishlist: !!wishlistItem });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ message: 'Error checking wishlist' });
  }
});

// Add a product to wishlist
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    console.log('Adding to wishlist - User ID:', userId, 'Type:', typeof userId);
    console.log('Product ID:', productId, 'Type:', typeof productId);
    console.log('Request User:', JSON.stringify(req.user, null, 2));
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.log('User check: Not found');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User check: Found');

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      console.log('Product check: Not found');
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log('Product check: Found');

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({
      where: { user_id: userId, product_id: productId }
    });
    if (existingItem) {
      console.log('Existing wishlist item check: Found');
      return res.status(400).json({ message: 'Product already in wishlist' });
    }
    console.log('Existing wishlist item check: Not found');

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      user_id: userId,
      product_id: productId
    });
    console.log('Created wishlist item:', wishlistItem.id);

    res.status(201).json(wishlistItem);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    if (error.fields) {
      console.error('Error fields:', error.fields);
    }
    if (error.errors && error.errors.length > 0) {
      error.errors.forEach(err => {
        console.error('Validation error:', err.message, 'Path:', err.path, 'Value:', err.value);
      });
    }
    res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
  }
});

// Remove a product from wishlist
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    console.log('Removing from wishlist - User ID:', userId, 'ID:', id);

    // First try to find by wishlist item ID
    let wishlistItem = await Wishlist.findOne({
      where: { id: id, user_id: userId }
    });

    // If not found by wishlist item ID, try to find by product ID
    if (!wishlistItem) {
      wishlistItem = await Wishlist.findOne({
        where: { product_id: id, user_id: userId }
      });
    }

    if (!wishlistItem) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    await wishlistItem.destroy();
    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Error removing from wishlist' });
  }
});

module.exports = router; 