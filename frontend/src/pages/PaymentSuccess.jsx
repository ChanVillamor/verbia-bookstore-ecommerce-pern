import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { paymentAPI } from "../services/api";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const paymentIntentId = searchParams.get("payment_intent");
        const orderId = searchParams.get("order_id");

        if (!paymentIntentId) {
          throw new Error("No payment intent found in URL");
        }

        console.log("Confirming payment:", paymentIntentId);

        // Confirm the payment
        const response = await paymentAPI.confirmPayment(paymentIntentId);
        console.log("Payment confirmation response:", response.data);

        setPaymentDetails(response.data);

        // Clear the cart after successful payment
        await clearCart();

        setLoading(false);
      } catch (err) {
        console.error("Payment confirmation error:", err);
        setError(err.response?.data?.message || "Failed to confirm payment");
        setLoading(false);
      }
    };

    if (user) {
      confirmPayment();
    } else {
      navigate("/login", { state: { from: "/payment-success" } });
    }
  }, [user, navigate, searchParams, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="mt-1">{error}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Return to Home
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Return to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Payment Successful!
            </h2>
            <p className="mt-2 text-gray-600">
              Thank you for your purchase. Your payment has been confirmed.
            </p>
          </div>

          {paymentDetails && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Details
              </h3>
              <dl className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Amount</dt>
                  <dd className="text-sm text-gray-900">
                    ${paymentDetails.amount}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Status</dt>
                  <dd className="text-sm text-gray-900 capitalize">
                    {paymentDetails.status}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-8 flex justify-center space-x-4">
            {paymentDetails?.order_id && (
              <button
                onClick={() => navigate(`/orders/${paymentDetails.order_id}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Order Details
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
