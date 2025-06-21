import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ordersAPI } from "../services/api";
import Swal from "sweetalert2";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Get order details from location state or fetch from API
        const orderId = location.state?.orderId;

        console.log("OrderSuccess: Location state:", location.state);
        console.log("OrderSuccess: Order ID:", orderId);

        if (!orderId) {
          // If no order ID, show a generic success message
          setOrderDetails({
            id: "N/A",
            total_amount: location.state?.amount || "N/A",
            status: "completed",
            payment_status: "paid",
          });
          setLoading(false);
          return;
        }

        console.log("OrderSuccess: Fetching order with ID:", orderId);
        const response = await ordersAPI.getById(orderId);
        console.log("Order details:", response);

        if (!response) {
          throw new Error("Failed to fetch order details");
        }

        setOrderDetails(response.data);
        setLoading(false);

        // Show welcome message for successful orders
        if (orderId !== "N/A") {
          Swal.fire({
            icon: "success",
            title: "Welcome to Order Details!",
            text: `Order #${orderId} has been successfully placed.`,
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        // Show a fallback success message even if order details can't be fetched
        setOrderDetails({
          id: location.state?.orderId || "N/A",
          total_amount: location.state?.amount || "N/A",
          status: "completed",
          payment_status: "paid",
        });
        setLoading(false);

        // Show a gentle warning if order details couldn't be fetched
        if (location.state?.orderId) {
          Swal.fire({
            icon: "warning",
            title: "Order Confirmed",
            text: "Your payment was successful, but we couldn't load the order details. You can view your order in your order history.",
            confirmButtonText: "OK",
          });
        }
      }
    };

    if (user) {
      fetchOrderDetails();
    } else {
      navigate("/login", { state: { from: "/order-success" } });
    }
  }, [user, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md mx-4">
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
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Retry
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
              Order Placed Successfully!
            </h2>
            <p className="mt-2 text-gray-600">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {orderDetails && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">
                Order Details
              </h3>
              <dl className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">
                    Order ID
                  </dt>
                  <dd className="text-sm text-gray-900">{orderDetails.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">
                    Total Amount
                  </dt>
                  <dd className="text-sm text-gray-900">
                    ${orderDetails.total_amount}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Status</dt>
                  <dd className="text-sm text-gray-900 capitalize">
                    {orderDetails.status}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">
                    Payment Status
                  </dt>
                  <dd className="text-sm text-gray-900 capitalize">
                    {orderDetails.payment_status}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Tracking Info Notification */}
          {orderDetails &&
            (orderDetails.tracking_number ||
              orderDetails.tracking_url ||
              orderDetails.estimated_delivery) && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-blue-900 font-semibold mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7m0 0H4m8 0h8"
                    />
                  </svg>
                  Track Your Order
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700 font-medium">
                      Tracking Number
                    </span>
                    <span className="text-sm text-blue-900">
                      {orderDetails.tracking_number || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700 font-medium">
                      Tracking URL
                    </span>
                    <span className="text-sm text-blue-900">
                      {orderDetails.tracking_url ? (
                        <a
                          href={orderDetails.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-700"
                        >
                          Track Package
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700 font-medium">
                      Estimated Delivery
                    </span>
                    <span className="text-sm text-blue-900">
                      {orderDetails.estimated_delivery
                        ? new Date(
                            orderDetails.estimated_delivery
                          ).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}

          <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate("/orders")}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View All Orders
            </button>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
