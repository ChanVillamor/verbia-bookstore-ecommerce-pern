import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ordersAPI, adminAPI } from "../../services/api";
import Swal from "sweetalert2";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState({
    tracking_number: "",
    tracking_url: "",
    estimated_delivery: "",
  });
  const [trackingEdit, setTrackingEdit] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getAdminById(id);
        setOrder(response.data);
        if (response.data) {
          setTracking({
            tracking_number: response.data.tracking_number || "",
            tracking_url: response.data.tracking_url || "",
            estimated_delivery: response.data.estimated_delivery
              ? response.data.estimated_delivery.slice(0, 16)
              : "",
          });
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(
          err.response?.data?.message || "Failed to fetch order details"
        );
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to fetch order details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone. The order will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await adminAPI.deleteOrder(id);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Order has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        navigate("/admin/orders");
      } catch (err) {
        console.error("Failed to delete order:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to delete order.";
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }
    }
  };

  const handleTrackingChange = (e) => {
    const { name, value } = e.target;
    setTracking((prev) => ({ ...prev, [name]: value }));
  };

  const handleTrackingSave = async () => {
    setTrackingLoading(true);
    try {
      await adminAPI.updateOrderTracking(id, tracking);
      Swal.fire({
        icon: "success",
        title: "Tracking Updated",
        timer: 1500,
        showConfirmButton: false,
      });
      setTrackingEdit(false);
      // Refresh order data
      const response = await ordersAPI.getAdminById(id);
      setOrder(response.data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message ||
          "Failed to update tracking information.",
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-red-600 animate-spin"></div>
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
              onClick={() => navigate("/admin/orders")}
              className="px-6 py-2 mt-4 text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const shippingAddress =
    typeof order.shipping_address === "string"
      ? JSON.parse(order.shipping_address)
      : order.shipping_address;

  const user = order.user || {};

  return (
    <div className="py-8 min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-4xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between items-start mb-8 space-y-4 lg:flex-row lg:items-center lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Admin Order Details
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Order #{order.id} • {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => navigate("/admin/orders")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Orders
            </button>
            {["pending", "cancelled"].includes(order.status) && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md border border-transparent hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Order
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order Header Card */}
            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Order #{order.id}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
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
                        : order.status === "shipped"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items Card */}
            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Items
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.orderDetails?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <img
                        src={
                          item.product?.image?.startsWith("http")
                            ? item.product.image
                            : `${
                                import.meta.env.VITE_API_URL?.replace(
                                  "/api",
                                  ""
                                ) || "http://localhost:5000"
                              }${item.product?.image}`
                        }
                        alt={item.product?.title}
                        className="object-cover w-16 h-20 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product?.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shipping Information Card */}
            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Shipping Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-900">
                      Shipping Address
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{shippingAddress?.name}</p>
                      <p>{shippingAddress?.street}</p>
                      <p>
                        {shippingAddress?.city}, {shippingAddress?.state}{" "}
                        {shippingAddress?.zipCode}
                      </p>
                      <p>{shippingAddress?.country}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-900">
                      Customer Info
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Name:</strong> {user.name || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong> {user.email || "N/A"}
                      </p>
                      <p>
                        <strong>User ID:</strong> {order.user_id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information Card */}
            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Payment Method
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {order.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Payment Status
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.payment_status.charAt(0).toUpperCase() +
                      order.payment_status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Summary
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tracking Number</span>
                  <span className="text-sm text-gray-900">
                    {order.tracking_number || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Items</span>
                  <span className="text-sm text-gray-900">
                    {order.orderDetails?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <span className="text-base font-medium text-gray-900">
                    Total
                  </span>
                  <span className="text-lg font-semibold text-green-600">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracking Information Card */}
            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tracking Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tracking Number</span>
                  <span className="text-sm text-gray-900">
                    {order.tracking_number || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tracking URL</span>
                  <span className="text-sm text-blue-600">
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {order.tracking_url}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Estimated Delivery
                  </span>
                  <span className="text-sm text-gray-900">
                    {order.estimated_delivery
                      ? formatDate(order.estimated_delivery)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Delete Warning */}
            {!["pending", "cancelled"].includes(order.status) && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  This order cannot be deleted because it has status:{" "}
                  <strong>{order.status}</strong>
                </p>
                <p className="mt-2 text-xs text-yellow-700">
                  Only pending or cancelled orders can be deleted.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default AdminOrderDetails;
