const { Payment, Order, User } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a mock checkout session
const createCheckoutSession = async (req, res) => {
  try {
    const { amount, shipping_address } = req.body;
    const userId = req.user.id;

    // Create a mock payment record
    const payment = await Payment.create({
      id: uuidv4(),
      user_id: userId,
      amount: amount,
      currency: "usd",
      status: "succeeded",
      payment_method: "mock",
      payment_intent_id: `mock_${uuidv4()}`,
      payment_method_details: {
        type: "mock",
        card: {
          brand: "mock",
          last4: "4242",
        },
      },
    });

    res.json({
      sessionId: payment.id,
      paymentIntentId: payment.payment_intent_id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

// Verify a mock payment
const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({
      where: {
        payment_intent_id: paymentIntentId,
        user_id: userId,
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

// Get payment history for a user
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Order,
          attributes: ["id", "total_amount", "status"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
};

// Get payment details
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        user_id: userId,
      },
      include: [
        {
          model: Order,
          attributes: ["id", "total_amount", "status"],
        },
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ message: "Failed to fetch payment details" });
  }
};

module.exports = {
  createCheckoutSession,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
}; 