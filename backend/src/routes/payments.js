const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');
const db = require('../models');
const crypto = require('crypto');

// Create payment intent for Stripe
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        user_id: req.user.id,
        user_email: req.user.email
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: 'Error creating payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Confirm payment and create order
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, orderData } = req.body;

    console.log('Confirm payment request:', {
      paymentIntentId,
      orderData: {
        total_amount: orderData?.total_amount,
        items_count: orderData?.items?.length,
        shipping_address: orderData?.shipping_address
      },
      userId: req.user.id
    });

    if (!paymentIntentId || !orderData) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Create the order with payment information
    const transaction = await db.sequelize.transaction();

    try {
      const tracking_number = 'TRK-' + crypto.randomBytes(6).toString('hex').toUpperCase();
      const tracking_url = `https://track.example.com/${tracking_number}`;
      const estimated_delivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

      const order = await db.Order.create({
        user_id: req.user.id,
        total_amount: orderData.total_amount,
        shipping_address: orderData.shipping_address,
        payment_method: 'stripe',
        payment_intent_id: paymentIntentId,
        status: 'pending',
        payment_status: 'paid',
        tracking_number,
        tracking_url,
        estimated_delivery,
        phone_number: orderData.phone_number
      }, { transaction });

      console.log('Order created:', {
        orderId: order.id,
        totalAmount: order.total_amount,
        status: order.status
      });

      // Create order details
      const orderDetails = [];
      for (const item of orderData.items) {
        const product = await db.Product.findByPk(item.product_id);
        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.title}`);
        }

        // Update product stock and sales count
        product.stock -= item.quantity;
        product.sales_count += item.quantity;
        await product.save({ transaction });

        orderDetails.push({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        });
      }

      await db.OrderDetail.bulkCreate(orderDetails, { transaction });
      await transaction.commit();

      console.log('Order details created, transaction committed');

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          id: order.id,
          total_amount: order.total_amount,
          status: order.status,
          payment_status: order.payment_status
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      message: 'Error confirming payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Skip webhook processing if no secret is configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('Webhook secret not configured, skipping webhook processing');
    return res.json({ received: true, message: 'Webhook secret not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // You can update order status here if needed
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router; 