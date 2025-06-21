const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../models');
const { auth } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Op } = require('sequelize');
const crypto = require('crypto');

const router = express.Router();

// Get all orders for a user
router.get('/', auth, async (req, res) => {
  try {
    const orders = await db.Order.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: db.OrderDetail,
          as: 'orderDetails',
          include: [{ model: db.Product, as: 'product' }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get a specific order
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching order:', {
      orderId: req.params.id,
      userId: req.user.id,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });

    const order = await db.Order.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      },
      include: [
        {
          model: db.OrderDetail,
          as: 'orderDetails',
          include: [{ 
            model: db.Product, 
            as: 'product',
            attributes: ['id', 'title', 'price', 'sale_price', 'image']
          }],
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }
      ],
    });

    if (!order) {
      console.log('Order not found:', {
        orderId: req.params.id,
        userId: req.user.id
      });
      return res.status(404).json({ 
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND',
        details: {
          orderId: req.params.id,
          userId: req.user.id
        }
      });
    }

    console.log('Order found:', {
      orderId: order.id,
      userId: order.user_id,
      totalAmount: order.total_amount,
      status: order.status,
      detailsCount: order.orderDetails?.length
    });

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      orderId: req.params.id,
      userId: req.user.id
    });

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error while fetching order',
        errors: error.errors.map(err => ({
          path: err.path,
          message: err.message,
          value: err.value
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({ 
      message: 'Error fetching order',
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
      code: 'SERVER_ERROR'
    });
  }
});

// Helper function to validate request body
const validateOrderRequest = (body) => {
  const errors = [];
  
  // Check required fields
  const requiredFields = ['items', 'total_amount', 'shipping_address', 'payment_method', 'phone_number'];
  for (const field of requiredFields) {
    if (!body[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate items array
  if (body.items) {
    if (!Array.isArray(body.items)) {
      errors.push('Items must be an array');
    } else if (body.items.length === 0) {
      errors.push('Items array cannot be empty');
    } else {
      body.items.forEach((item, index) => {
        if (!item.product_id) {
          errors.push(`Item at index ${index} is missing product_id`);
        }
        if (!item.quantity || item.quantity < 1) {
          errors.push(`Item at index ${index} has invalid quantity`);
        }
        if (!item.price || item.price <= 0) {
          errors.push(`Item at index ${index} has invalid price`);
        }
      });
    }
  }

  // Validate total_amount
  if (body.total_amount && (isNaN(body.total_amount) || body.total_amount <= 0)) {
    errors.push('Total amount must be a positive number');
  }

  // Validate shipping_address
  if (body.shipping_address) {
    if (typeof body.shipping_address !== 'object') {
      errors.push('Shipping address must be an object');
    } else {
      const requiredAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];
      for (const field of requiredAddressFields) {
        if (!body.shipping_address[field]) {
          errors.push(`Shipping address is missing required field: ${field}`);
        }
      }
    }
  }

  // Validate payment_method
  const validPaymentMethods = ['stripe', 'paypal', 'mock'];
  if (body.payment_method && !validPaymentMethods.includes(body.payment_method)) {
    errors.push(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
  }

  return errors;
};

// Create a new order
router.post('/', auth, async (req, res) => {
  console.log('Received order creation request:', {
    user_id: req.user.id,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    },
    body: req.body,
    headers: {
      authorization: req.header('Authorization'),
      cookie: req.header('Cookie'),
      host: req.header('Host'),
      origin: req.header('Origin')
    }
  });

  // Validate user exists and is active
  const user = await db.User.findByPk(req.user.id);
  if (!user) {
    console.error('User not found:', {
      requested_id: req.user.id,
      user: req.user
    });
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  console.log('User found:', {
    id: user.id,
    email: user.email,
    role: user.role
  });

  const transaction = await db.Order.sequelize.transaction();

  try {
    const { items, total_amount, shipping_address, payment_method, phone_number } = req.body;

    // Validate request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items array:', items);
      return res.status(400).json({
        message: 'Order must contain at least one item',
        code: 'INVALID_ITEMS'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.price) {
        console.error('Invalid item:', item);
        return res.status(400).json({
          message: 'Each item must have product_id, quantity, and price',
          code: 'INVALID_ITEM_DATA'
        });
      }
    }

    // Validate all products exist and have sufficient stock
    const productIds = items.map(item => item.product_id);
    console.log('Validating products:', productIds);

    const products = await db.Product.findAll({
      where: {
        id: {
          [Op.in]: productIds
        }
      },
      transaction
    });

    // Check if all products were found
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      console.error('Some products were not found:', {
        requested: productIds,
        found: foundIds,
        missing: missingIds
      });
      return res.status(404).json({
        message: 'One or more products not found',
        missingProducts: missingIds,
        code: 'PRODUCTS_NOT_FOUND'
      });
    }

    // Create a map of products for easy lookup
    const productMap = products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});

    // Validate stock and calculate total
    let calculatedTotal = 0;
    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) {
        console.error(`Product not found with ID: ${item.product_id}`);
        return res.status(404).json({
          message: `Product not found: ${item.product_id}`,
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      if (product.stock < item.quantity) {
        console.error(`Insufficient stock for product ${item.product_id}`);
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.title}`,
          code: 'INSUFFICIENT_STOCK'
        });
      }

      calculatedTotal += item.price * item.quantity;
    }

    // Validate total amount
    if (Math.abs(calculatedTotal - total_amount) > 0.01) {
      console.error('Total amount mismatch:', {
        calculated: calculatedTotal,
        provided: total_amount
      });
      return res.status(400).json({
        message: 'Total amount does not match calculated total',
        code: 'TOTAL_MISMATCH'
      });
    }

    // Generate tracking fields
    const tracking_number = 'TRK-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const tracking_url = `https://track.example.com/${tracking_number}`;
    const estimated_delivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

    // Create the order
    const orderData = {
      user_id: user.id, // Ensure user_id is included
      total_amount,
      shipping_address: shipping_address, // Send as object, not string
      payment_method,
      status: "pending",
      payment_status: "paid", // Assuming payment is processed immediately for mock
      tracking_number,
      tracking_url,
      estimated_delivery,
      phone_number: shipping_address.phone || phone_number
    };

    console.log('Attempting to create order with data:', orderData);
    const order = await db.Order.create(orderData, { transaction });

    console.log('Order created:', order.toJSON());

    // Create order details
    const orderDetails = [];
    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) {
        throw new Error(`Product not found with ID: ${item.product_id} during order detail creation`);
      }
      const price = product.sale_price || product.price;
      const subtotal = price * item.quantity;
      orderDetails.push({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: price,
        subtotal: subtotal // Calculate and include subtotal
      });
    }

    console.log('Attempting to create order details with data:', orderDetails);
    await db.OrderDetail.bulkCreate(orderDetails, { transaction });
    console.log('Order details created successfully.');

    // Decrease product stock
    for (const item of items) {
      const product = productMap[item.product_id];
      product.stock -= item.quantity;
      // Increment sales count
      product.sales_count += item.quantity;
      await product.save({ transaction });
      console.log(`Decreased stock for product ${product.id}. New stock: ${product.stock}, New sales count: ${product.sales_count}`);
    }

    await transaction.commit();
    console.log('Transaction committed successfully.');

    res.status(201).json({
      message: 'Order created successfully!',
      order: {
        order_id: order.id,
        total_amount: order.total_amount,
        shipping_address: order.shipping_address,
        payment_method: order.payment_method,
        status: order.status,
        payment_status: order.payment_status,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        estimated_delivery: order.estimated_delivery,
        phone_number: order.phone_number,
        orderDetails: orderDetails.map(detail => ({
          product_id: detail.product_id,
          quantity: detail.quantity,
          price: detail.price
        })),
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating order. Rolling back transaction:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      errors: error.errors ? JSON.stringify(error.errors, null, 2) : undefined, // Sequelize validation errors
      sql: error.sql, // SQL query if available
      original: error.original, // Original error from DB driver
      fields: error.fields, // Fields involved in the error
      value: error.value, // Value that caused the error
      path: error.path, // Path of the error
      parameters: error.parameters, // Parameters of the query
    });

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      let errorMessage = 'Invalid reference: One or more referenced records do not exist or are incorrectly linked.';
      if (error.fields && error.fields.length > 0) {
        errorMessage += ` Fields: ${error.fields.join(', ')}.`;
      }
      if (error.value) {
        errorMessage += ` Value: ${error.value}.`;
      }
      if (error.table) {
        errorMessage += ` Table: ${error.table}.`;
      }
      return res.status(400).json({
        message: errorMessage,
        code: 'FOREIGN_KEY_CONSTRAINT_ERROR',
        details: {
          fields: error.fields,
          value: error.value,
          table: error.table,
          original: error.original?.message || error.original,
        }
      });
    } else if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(err => ({
          path: err.path,
          message: err.message,
          value: err.value
        })),
        code: 'VALIDATION_ERROR'
      });
    } else if (error.message.includes('Product not found') || error.message.includes('Insufficient stock') || error.message.includes('Total amount mismatch')) {
      return res.status(400).json({
        message: error.message,
        code: error.message.includes('Product not found') ? 'PRODUCT_NOT_FOUND' : (error.message.includes('Insufficient stock') ? 'INSUFFICIENT_STOCK' : 'TOTAL_MISMATCH'),
      });
    }

    res.status(500).json({
      message: 'Error creating order',
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
      code: 'SERVER_ERROR',
    });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await db.Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status });
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Delete an order
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await db.Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: db.OrderDetail,
          as: 'orderDetails'
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending orders can be deleted' 
      });
    }

    // Restore product stock and decrease sales count
    for (const detail of order.orderDetails) {
      const product = await db.Product.findByPk(detail.product_id);
      if (product) {
        product.stock += detail.quantity;
        product.sales_count = Math.max(0, product.sales_count - detail.quantity);
        await product.save();
      }
    }

    // Delete the order (this will cascade delete order details)
    await order.destroy();

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order' });
  }
});

module.exports = router; 