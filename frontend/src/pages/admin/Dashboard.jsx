import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import Swal from "sweetalert2";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    products: 0,
    users: 0,
  });
  const [dailyStats, setDailyStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastResetDate, setLastResetDate] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await adminAPI.getDashboard();
        setStats(data.statistics);
        setRecentOrders(data.recentOrders);
        setLowStockProducts(data.lowStockProducts);

        // Calculate daily stats
        const today = new Date();
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        const todayOrders = data.recentOrders.filter(
          (order) => new Date(order.createdAt) >= todayStart
        );

        const todayRevenue = todayOrders.reduce(
          (total, order) => total + parseFloat(order.total_amount || 0),
          0
        );

        setDailyStats({
          todayOrders: todayOrders.length,
          todayRevenue: todayRevenue,
        });

        // Set last reset date
        setLastResetDate(todayStart.toLocaleDateString());
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Error fetching dashboard data",
          confirmButtonColor: "#3B82F6",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 md:gap-0">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">Last reset: {lastResetDate}</div>
      </div>

      {/* Daily Statistics */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Today's Metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium opacity-90">Today's Orders</p>
                <p className="text-2xl font-bold">{dailyStats.todayOrders}</p>
              </div>
            </div>
          </div>

          <div className="p-6 text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium opacity-90">
                  Today's Revenue
                </p>
                <p className="text-2xl font-bold">
                  ${dailyStats.todayRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All-Time Statistics */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          All-Time Statistics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex justify-center items-center w-8 h-8 bg-indigo-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex justify-center items-center w-8 h-8 bg-green-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex justify-center items-center w-8 h-8 bg-purple-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex justify-center items-center w-8 h-8 bg-yellow-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 mb-8 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-5">
          <Link
            to="/admin/products/new"
            className="p-4 text-center text-white bg-blue-500 rounded transition-colors hover:bg-blue-600"
          >
            Add Product
          </Link>
          <Link
            to="/admin/orders"
            className="p-4 text-center text-white bg-green-500 rounded transition-colors hover:bg-green-600"
          >
            View Orders
          </Link>
          <Link
            to="/admin/order-history"
            className="p-4 text-center text-white bg-indigo-500 rounded transition-colors hover:bg-indigo-600"
          >
            Order History
          </Link>
          <Link
            to="/admin/categories"
            className="p-4 text-center text-white bg-purple-500 rounded transition-colors hover:bg-purple-600"
          >
            Manage Categories
          </Link>
          <Link
            to="/admin/users"
            className="p-4 text-center text-white bg-orange-500 rounded transition-colors hover:bg-orange-600"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="p-2 sm:p-4 mb-8 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-bold">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="py-2 text-left">Order ID</th>
                <th className="py-2 text-left">Customer</th>
                <th className="py-2 text-left">Date</th>
                <th className="py-2 text-left">Amount</th>
                <th className="py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-2">{order.id}</td>
                  <td className="py-2">{order.user?.name || "N/A"}</td>
                  <td className="py-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    ${Number(order.total_amount)?.toFixed(2) || "0.00"}
                  </td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status || "pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Products */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-bold">Low Stock Products</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-2 text-left">Product</th>
                <th className="py-2 text-left">Category</th>
                <th className="py-2 text-left">Stock</th>
                <th className="py-2 text-left">Price</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.id}>
                  <td className="py-2">
                    <div className="flex items-center">
                      <img
                        src={
                          `${
                            import.meta.env.VITE_API_URL?.replace("/api", "") ||
                            "http://localhost:5000"
                          }${product.image}` || "/placeholder-book.jpg"
                        }
                        alt={product.title || "Product"}
                        className="object-cover mr-2 w-10 h-10 rounded"
                      />
                      <span>{product.title || "Untitled Product"}</span>
                    </div>
                  </td>
                  <td className="py-2">
                    {product.Categories && product.Categories.length > 0
                      ? product.Categories.map((cat) => cat.name).join(", ")
                      : "Uncategorized"}
                  </td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        product.stock === 0
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {product.stock || 0}
                    </span>
                  </td>
                  <td className="py-2">${(product.price || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
