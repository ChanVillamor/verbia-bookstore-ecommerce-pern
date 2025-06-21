const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../models');
const { adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    console.log('Fetching dashboard data...');
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      db.User.count(),
      db.Product.count(),
      db.Order.count(),
      db.Order.sum('total_amount'),
      db.Order.findAll({
        include: [
          {
            model: db.User,
            attributes: ['id', 'name', 'email'],
            as: 'user'
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 5
      }),
      db.Product.findAll({
        where: {
          stock: {
            [Op.lte]: 10
          }
        },
        include: [{
          model: db.Category,
          attributes: ['id', 'name'],
          as: 'Categories'
        }],
        order: [['stock', 'ASC']],
        limit: 5
      })
    ]);

    console.log('Fetched low stock products:', lowStockProducts.map(p => ({ id: p.id, title: p.title, stock: p.stock, Categories: p.Categories ? p.Categories.map(c => ({ id: c.id, name: c.name })) : null })));

    console.log('Dashboard data fetched successfully');
    res.json({
      statistics: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue || 0
      },
      recentOrders,
      lowStockProducts: lowStockProducts.map(product => ({
        ...product.toJSON(),
        Categories: product.Categories || []
      })),
      revenueByDay: [] // Temporarily return empty array until we fix the revenue query
    });
  } catch (error) {
    console.error('Dashboard error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user role
router.patch('/users/:id/role',
  adminAuth,
  [
    body('role')
      .isIn(['user', 'admin'])
      .withMessage('Invalid role')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await db.User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.update({ role: req.body.role });
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Error updating user role:', {
        message: error.message,
        stack: error.stack,
        user_id: req.params.id
      });
      res.status(500).json({ 
        message: 'Error updating user role',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', {
      message: error.message,
      stack: error.stack,
      user_id: req.params.id
    });
    res.status(500).json({ 
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all orders
router.get('/orders', adminAuth, async (req, res) => {
  try {
    console.log('Fetching all orders...');
    const orders = await db.Order.findAll({
      include: [
        {
          model: db.User,
          attributes: ['id', 'name', 'email'],
          as: 'user'
        },
        {
          model: db.OrderDetail,
          as: 'orderDetails',
          include: [
            {
              model: db.Product,
              attributes: ['id', 'title', 'author', 'image', 'price'],
              as: 'product'
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    console.log(`Found ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update order status
router.patch('/orders/:id/status',
  adminAuth,
  [
    body('status')
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await db.Order.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: db.User,
            attributes: ['id', 'name', 'email'],
            as: 'user'
          },
          {
            model: db.OrderDetail,
            as: 'orderDetails',
            include: [
              {
                model: db.Product,
                attributes: ['id', 'title', 'author', 'image', 'price'],
                as: 'product'
              }
            ]
          }
        ]
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      await order.update({ status: req.body.status });
      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', {
        message: error.message,
        stack: error.stack,
        order_id: req.params.id
      });
      res.status(500).json({ 
        message: 'Error updating order status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update order tracking
router.patch('/orders/:id/tracking',
  adminAuth,
  [
    body('tracking_number').optional().isString(),
    body('tracking_url').optional().isURL(),
    body('estimated_delivery').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await db.Order.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: db.User,
            attributes: ['id', 'name', 'email'],
            as: 'user'
          },
          {
            model: db.OrderDetail,
            as: 'orderDetails',
            include: [
              {
                model: db.Product,
                attributes: ['id', 'title', 'author', 'image', 'price'],
                as: 'product'
              }
            ]
          }
        ]
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      await order.update({
        tracking_number: req.body.tracking_number,
        tracking_url: req.body.tracking_url,
        estimated_delivery: req.body.estimated_delivery
      });

      res.json(order);
    } catch (error) {
      console.error('Error updating order tracking:', {
        message: error.message,
        stack: error.stack,
        order_id: req.params.id
      });
      res.status(500).json({ 
        message: 'Error updating order tracking',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get order by ID (Admin)
router.get('/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await db.Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.User,
          attributes: ['id', 'name', 'email'],
          as: 'user'
        },
        {
          model: db.OrderDetail,
          as: 'orderDetails',
          include: [
            {
              model: db.Product,
              attributes: ['id', 'title', 'author', 'image', 'price'],
              as: 'product'
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND',
        details: {
          orderId: req.params.id
        }
      });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order by ID (admin):', {
      message: error.message,
      stack: error.stack,
      order_id: req.params.id
    });
    res.status(500).json({
      message: 'Error fetching order by ID',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete order (Admin)
router.delete('/orders/:id', adminAuth, async (req, res) => {
  try {
    console.log('Admin deleting order:', {
      orderId: req.params.id,
      adminId: req.user.id,
      adminEmail: req.user.email
    });

    const order = await db.Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.OrderDetail,
          as: 'orderDetails'
        },
        {
          model: db.User,
          attributes: ['id', 'name', 'email'],
          as: 'user'
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Only allow deletion of pending or cancelled orders
    if (!['pending', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ 
        message: `Cannot delete order with status '${order.status}'. Only pending or cancelled orders can be deleted.`,
        code: 'INVALID_ORDER_STATUS',
        currentStatus: order.status,
        allowedStatuses: ['pending', 'cancelled']
      });
    }

    // Check if order has been shipped or delivered
    if (['shipped', 'delivered', 'processing'].includes(order.status)) {
      return res.status(400).json({ 
        message: `Cannot delete order that has been ${order.status}. Please cancel the order first.`,
        code: 'ORDER_ALREADY_PROCESSED',
        currentStatus: order.status
      });
    }

    // Restore product stock and decrease sales count
    for (const detail of order.orderDetails) {
      const product = await db.Product.findByPk(detail.product_id);
      if (product) {
        product.stock += detail.quantity;
        product.sales_count = Math.max(0, product.sales_count - detail.quantity);
        await product.save();
        console.log(`Restored stock for product ${product.id}: +${detail.quantity} units`);
      }
    }

    // Delete the order (this will cascade delete order details)
    await order.destroy();

    console.log('Order deleted successfully:', req.params.id);

    res.json({ 
      message: 'Order deleted successfully',
      orderId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting order (admin):', {
      message: error.message,
      stack: error.stack,
      order_id: req.params.id,
      admin_id: req.user.id
    });
    res.status(500).json({ 
      message: 'Error deleting order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 