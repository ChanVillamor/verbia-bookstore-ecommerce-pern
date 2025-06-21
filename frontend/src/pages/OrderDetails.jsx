import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ordersAPI } from "../services/api";
import { getImageSrc } from "../utils/helpers";

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: `/orders/${id}` } });
      return;
    }

    // If we have order data in location state (from order success page), use it
    if (location.state?.order) {
      setOrder(location.state.order);
      setLoading(false);
      return;
    }

    // If no id, show error
    if (!id) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        console.log("Fetching order with ID:", id);
        const response = await ordersAPI.getById(id);
        console.log("Order fetch response:", response);
        setOrder(response.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(
          err.response?.data?.message || "Failed to fetch order details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user, location.state]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-8 min-h-screen bg-gray-50">
        <div className="px-4 mx-auto max-w-3xl sm:px-6 lg:px-8">
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">{error || "Order not found."}</p>
            <button
              onClick={() => navigate("/orders")}
              className="px-6 py-2 mt-4 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Parse shipping address if it's a string
  const shippingAddress =
    typeof order.shipping_address === "string"
      ? JSON.parse(order.shipping_address)
      : order.shipping_address;

  return (
    <div className="py-8 min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-3xl sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <button
            onClick={() => navigate("/orders")}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Back to Orders
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 mb-6 text-red-700 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-hidden bg-white rounded-lg shadow-sm">
          {/* Order Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Order #{order.id}
                </h2>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === "delivered"
                    ? "bg-green-100 text-green-800"
                    : order.status === "processing"
                    ? "bg-blue-100 text-blue-800"
                    : order.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 border-b">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Order Items
            </h3>
            <div className="space-y-4">
              {order.orderDetails?.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <img
                    src={getImageSrc(item.product.image)}
                    alt={item.product.title}
                    className="object-cover w-16 h-20 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {item.product.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="p-6 border-b">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Shipping Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Shipping Address
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {shippingAddress.street}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state}{" "}
                  {shippingAddress.zipCode}
                  <br />
                  {shippingAddress.country}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Contact Information
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {user.name}
                  <br />
                  {user.phone || "N/A"}
                  <br />
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Tracking Information */}
          {(order.tracking_number ||
            order.tracking_url ||
            order.estimated_delivery) && (
            <div className="p-6 bg-blue-50 border-b">
              <h3 className="flex items-center mb-4 text-lg font-semibold text-blue-900">
                <svg
                  className="mr-2 w-5 h-5 text-blue-600"
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
                Tracking Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-700">
                    Tracking Number
                  </span>
                  <span className="text-sm text-blue-900">
                    {order.tracking_number || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-700">
                    Tracking URL
                  </span>
                  <span className="text-sm text-blue-900">
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline"
                      >
                        Track Package
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-700">
                    Estimated Delivery
                  </span>
                  <span className="text-sm text-blue-900">
                    {order.estimated_delivery
                      ? new Date(order.estimated_delivery).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="p-6 border-b">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Payment Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Payment Method
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {order.payment_method}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Payment Status
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {order.payment_status}
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Order Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm text-gray-900">
                  ${order.total_amount}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-base font-medium text-gray-900">
                  Total
                </span>
                <span className="text-base font-medium text-gray-900">
                  ${order.total_amount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
