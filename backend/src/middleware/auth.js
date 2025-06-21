const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    // Log the incoming request headers
    console.log('Auth middleware - Request headers:', {
      authorization: req.header('Authorization'),
      cookie: req.header('Cookie'),
      host: req.header('Host'),
      origin: req.header('Origin')
    });

    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({ message: 'No authorization header provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('No token found in Authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      });

      if (!decoded.id) {
        console.log('Invalid token: no user ID found');
        return res.status(401).json({ message: 'Invalid token: no user ID found' });
      }

      // Find user and verify they exist
      const user = await User.findByPk(decoded.id);
      console.log('User lookup result:', user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : 'User not found');

      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach user and token to request
      req.user = user;
      req.token = token;
      console.log('Auth successful. User attached to request:', {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      });
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', {
        message: jwtError.message,
        name: jwtError.name,
        stack: jwtError.stack
      });
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        console.log('Admin access denied for user:', {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        });
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      console.log('Admin access granted for user:', {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      });
      next();
    });
  } catch (error) {
    console.error('Admin auth error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

module.exports = { auth, adminAuth }; 