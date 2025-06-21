import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import Swal from "sweetalert2";
import { getImageSrc } from "../utils/helpers";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

console.log(
  "Stripe publishable key:",
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);
console.log("Stripe promise:", stripePromise);

const CheckoutForm = ({ orderData, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    console.log("Starting payment process...");

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again.");
      setLoading(false);
      return;
    }

    try {
      console.log(
        "Creating payment intent with amount:",
        orderData.total_amount
      );

      // Create payment intent
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/payments/create-payment-intent`,
        {
          amount: Math.round(orderData.total_amount * 100), // Convert to cents
          currency: "usd",
          items: orderData.items,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Payment intent created:", response.data);

      // Confirm card payment
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(response.data.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: orderData.shipping_address.name,
              email: orderData.shipping_address.email,
            },
          },
        });

      console.log("Stripe payment result:", { stripeError, paymentIntent });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        console.log("Payment succeeded, confirming with backend...");

        // Confirm payment with backend
        const { data: orderResponse } = await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/payments/confirm-payment`,
          {
            paymentIntentId: paymentIntent.id,
            orderId: orderData.orderId,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Payment confirmed, order response:", orderResponse);

        // Pass the order data from backend response
        const successData = {
          orderId: orderResponse.order.id,
          amount: orderResponse.order.total_amount,
          paymentIntentId: paymentIntent.id,
        };

        console.log("Calling onSuccess with data:", successData);
        onSuccess(successData);
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMessage =
        err.response?.data?.message || "Payment failed. Please try again.";
      setError(errorMessage);
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Payment Information</h3>
        <div className="p-4 rounded-md border border-gray-300">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
        {error && (
          <div className="p-3 mt-4 text-red-700 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="px-4 py-3 w-full text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading
          ? "Processing..."
          : `Pay $${orderData.total_amount.toFixed(2)}`}
      </button>
    </form>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || "",
    email: user?.email || "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });

  console.log("Checkout component rendered:", {
    user: user?.id,
    cartItemsCount: cartItems.length,
    orderData: orderData ? "set" : "null",
  });

  useEffect(() => {
    console.log("Checkout useEffect triggered:", {
      user: user?.id,
      cartItemsCount: cartItems.length,
    });

    if (!user) {
      console.log("No user, redirecting to login");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (cartItems.length === 0) {
      console.log("No cart items, redirecting to cart");
      navigate("/cart");
      return;
    }

    // Calculate order data
    const total_amount = cartItems.reduce((total, item) => {
      const price = item.sale_price || item.price;
      return total + price * item.quantity;
    }, 0);

    const newOrderData = {
      items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.sale_price || item.price,
      })),
      total_amount,
    };

    console.log("Setting order data:", newOrderData);
    setOrderData(newOrderData);
  }, [user, cartItems, navigate]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentSuccess = (paymentIntent) => {
    console.log("Payment success handler called with:", paymentIntent);
    console.log("PaymentIntent amount type:", typeof paymentIntent.amount);
    console.log("PaymentIntent amount value:", paymentIntent.amount);
    console.log("Clearing cart...");
    clearCart();

    // Ensure amount is a number and handle potential undefined values
    const amount =
      typeof paymentIntent.amount === "number"
        ? paymentIntent.amount
        : parseFloat(paymentIntent.amount) || 0;

    console.log("Processed amount:", amount);

    // Show success alert before navigation
    Swal.fire({
      icon: "success",
      title: "Payment Successful!",
      html: `
        <div class="text-center">
          <p class="mb-2">Your order has been placed successfully!</p>
          <p class="text-lg font-semibold text-green-600">$${amount.toFixed(
            2
          )}</p>
          <p class="mt-2 text-sm text-gray-600">Redirecting to order details...</p>
        </div>
      `,
      timer: 2500,
      showConfirmButton: false,
      allowOutsideClick: false,
      timerProgressBar: true,
    }).then(() => {
      console.log("Navigating to order success with state:", {
        orderId: paymentIntent.orderId,
        amount: amount,
      });
      navigate("/order-success", {
        state: {
          orderId: paymentIntent.orderId,
          amount: amount,
        },
      });
    });
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    // Error is already displayed in the form
  };

  const updateOrderData = () => {
    if (orderData) {
      setOrderData((prev) => ({
        ...prev,
        shipping_address: shippingAddress,
        phone_number: shippingAddress.phone,
      }));
    }
  };

  if (!user || !orderData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8 min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-4xl sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={getImageSrc(item.image)}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        $
                        {(
                          (item.sale_price || item.price) * item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${orderData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Shipping Address</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={shippingAddress.name}
                    onChange={handleAddressChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={shippingAddress.email}
                    onChange={handleAddressChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleAddressChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleAddressChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleAddressChange}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                orderData={{
                  ...orderData,
                  shipping_address: shippingAddress,
                  phone_number: shippingAddress.phone,
                }}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
