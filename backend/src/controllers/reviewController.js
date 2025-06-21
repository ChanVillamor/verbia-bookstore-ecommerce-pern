const pool = require('../db');

const reviewController = {
  // Create new review
  createReview: async (req, res) => {
    try {
      const { product_id, rating, comment } = req.body;
      const user_id = req.user.id;

      // Check if user has purchased the product
      const hasPurchased = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM orders o
          JOIN order_details od ON o.order_id = od.order_id
          WHERE o.user_id = $1 AND od.product_id = $2 AND o.status = 'delivered'
        )`,
        [user_id, product_id]
      );

      if (!hasPurchased.rows[0].exists) {
        return res.status(403).json({ message: 'You must purchase the book before reviewing it' });
      }

      // Check if user has already reviewed the product
      const existingReview = await pool.query(
        'SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2',
        [user_id, product_id]
      );

      if (existingReview.rows.length > 0) {
        return res.status(400).json({ message: 'You have already reviewed this book' });
      }

      const newReview = await pool.query(
        'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
        [user_id, product_id, rating, comment]
      );

      res.status(201).json(newReview.rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get reviews for a product
  getProductReviews: async (req, res) => {
    try {
      const { product_id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const reviews = await pool.query(
        `SELECT r.*, u.name as user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.product_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3`,
        [product_id, limit, offset]
      );

      res.json(reviews.rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update review
  updateReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const user_id = req.user.id;

      const updatedReview = await pool.query(
        'UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
        [rating, comment, id, user_id]
      );

      if (updatedReview.rows.length === 0) {
        return res.status(404).json({ message: 'Review not found or unauthorized' });
      }

      res.json(updatedReview.rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Delete review
  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const deletedReview = await pool.query(
        'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, user_id]
      );

      if (deletedReview.rows.length === 0) {
        return res.status(404).json({ message: 'Review not found or unauthorized' });
      }

      res.json({ message: 'Review deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get user's reviews
  getUserReviews: async (req, res) => {
    try {
      const user_id = req.user.id;
      const reviews = await pool.query(
        `SELECT r.*, p.title as product_title
        FROM reviews r
        JOIN products p ON r.product_id = p.product_id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC`,
        [user_id]
      );

      res.json(reviews.rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = reviewController; 