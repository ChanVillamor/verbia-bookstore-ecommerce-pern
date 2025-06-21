const pool = require('../db');
const crypto = require('crypto');

const orderController = {
  // Create new order
  createOrder: async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { items, payment_method = 'mock', shipping_address, phone_number } = req.body;
      const userId = req.user.id;
      
      // Log the incoming request for debugging
      console.log('Create Order Request Body:', req.body);
      
      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        const product = await client.query(
          'SELECT price, sale_price, stock FROM products WHERE product_id = $1',
          [item.product_id]
        );
        
        if (product.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        
        if (product.rows[0].stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_id}`);
        }
        
        const price = product.rows[0].sale_price || product.rows[0].price;
        totalAmount += price * item.quantity;
      }
      
      // Generate unique tracking number and URL
      const tracking_number = 'TRK-' + crypto.randomBytes(6).toString('hex').toUpperCase();
      const tracking_url = `https://track.example.com/${tracking_number}`;
      // Auto-generate estimated delivery (5 days from now)
      const estimated_delivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      
      // Create order with payment method, shipping address, tracking number, tracking url, and estimated delivery
      const newOrder = await client.query(
        'INSERT INTO orders (user_id, total_amount, payment_method, shipping_address, payment_status, tracking_number, tracking_url, estimated_delivery, phone_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [userId, totalAmount, payment_method, shipping_address || {}, 'paid', tracking_number, tracking_url, estimated_delivery, phone_number]
      );
      
      // Create order details and update stock
      for (const item of items) {
        
        await client.query(
          'INSERT INTO order_details (order_id, product_id, quantity, subtotal) VALUES ($1, $2, $3, $4)',
          [newOrder.rows[0].id, item.product_id, item.quantity, item.quantity * (item.sale_price || item.price)]
        );
        
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE product_id = $2',
          [item.quantity, item.product_id]
        );

      }
      
      await client.query('COMMIT');
      res.status(201).json(newOrder.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      // Log the error stack for debugging
      console.error('Order creation error:', err.stack || err);
      res.status(500).json({ message: err.message, stack: err.stack });
    } finally {
      client.release();
    }
  },

  // Get user's orders
  getUserOrders: async (req, res) => {
    try {
      const orders = await pool.query(
        `SELECT o.*, 
        json_agg(json_build_object(
          'product_id', od.product_id,
          'quantity', od.quantity,
          'subtotal', od.subtotal
        )) as items
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC`,
        [req.user.id]
      );
      
      res.json(orders.rows);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get single order
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await pool.query(
        `SELECT o.*, 
        json_agg(json_build_object(
          'product_id', od.product_id,
          'quantity', od.quantity,
          'subtotal', od.subtotal
        )) as items
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        WHERE o.id = $1 AND o.user_id = $2
        GROUP BY o.id`,
        [id, req.user.id]
      );
      
      if (order.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(order.rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update order status (admin only)
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const updatedOrder = await pool.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      
      if (updatedOrder.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(updatedOrder.rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = orderController; 