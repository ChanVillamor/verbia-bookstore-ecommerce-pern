const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const userController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const userExists = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        [name, email, hashedPassword]
      );

      // Create token
      const token = jwt.sign(
        { id: newUser.rows[0].user_id, role: newUser.rows[0].role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({
        token,
        user: {
          id: newUser.rows[0].user_id,
          name: newUser.rows[0].name,
          email: newUser.rows[0].email,
          role: newUser.rows[0].role
        }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (user.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.rows[0].password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Create token
      const token = jwt.sign(
        { id: user.rows[0].user_id, role: user.rows[0].role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        token,
        user: {
          id: user.rows[0].user_id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          role: user.rows[0].role
        }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await pool.query(
        'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = $1',
        [req.user.id]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user.rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
      
      const updatedUser = await pool.query(
        'UPDATE users SET name = $1, email = $2 WHERE user_id = $3 RETURNING *',
        [name, email, req.user.id]
      );

      res.json(updatedUser.rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = userController; 