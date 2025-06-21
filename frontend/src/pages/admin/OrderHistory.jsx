import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { adminAPI } from "../../services/api";
import Swal from "sweetalert2";

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [revenueFilter, setRevenueFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await adminAPI.getAllOrders();
      setOrders(response.data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to fetch orders",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
  };

  const handleRevenueFilter = (e) => {
    setRevenueFilter(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "today":
        return { start: today, end: now };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: now };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: monthAgo, end: now };
      case "year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return { start: yearAgo, end: now };
      case "daily":
        return { start: today, end: now };
      case "weekly":
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return { start: weekStart, end: now };
      case "monthly":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: now };
      case "yearly":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      default:
        return null;
    }
  };

  const filteredAndSortedOrders = orders
    .filter((order) => {
      // Search filter
      const matchesSearch =
        order.id.toString().includes(searchTerm) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderDetails?.some((detail) =>
          detail.product?.title
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        );

      // Status filter
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const dateRange = getDateRange(dateFilter);
        if (dateRange) {
          const orderDate = new Date(order.createdAt);
          matchesDate =
            orderDate >= dateRange.start && orderDate <= dateRange.end;
        }
      }

      // Revenue filter (additional date filtering for revenue metrics)
      let matchesRevenueFilter = true;
      if (revenueFilter !== "all") {
        const revenueDateRange = getDateRange(revenueFilter);
        if (revenueDateRange) {
          const orderDate = new Date(order.createdAt);
          matchesRevenueFilter =
            orderDate >= revenueDateRange.start &&
            orderDate <= revenueDateRange.end;
        }
      }

      return (
        matchesSearch && matchesStatus && matchesDate && matchesRevenueFilter
      );
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "total":
          aValue = parseFloat(a.total_amount || 0);
          bValue = parseFloat(b.total_amount || 0);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "user":
          aValue = a.user?.name || "";
          bValue = b.user?.name || "";
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getTotalRevenue = () => {
    // If revenue filter is set, calculate revenue for that specific period
    if (revenueFilter !== "all") {
      const revenueDateRange = getDateRange(revenueFilter);
      if (revenueDateRange) {
        const revenueOrders = orders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate >= revenueDateRange.start &&
            orderDate <= revenueDateRange.end
          );
        });
        return revenueOrders
          .reduce(
            (total, order) => total + parseFloat(order.total_amount || 0),
            0
          )
          .toFixed(2);
      }
    }

    // Otherwise, use the filtered orders (which respect all other filters)
    return filteredAndSortedOrders
      .reduce((total, order) => total + parseFloat(order.total_amount || 0), 0)
      .toFixed(2);
  };

  const getTotalOrders = () => {
    // If revenue filter is set, count orders for that specific period
    if (revenueFilter !== "all") {
      const revenueDateRange = getDateRange(revenueFilter);
      if (revenueDateRange) {
        const revenueOrders = orders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate >= revenueDateRange.start &&
            orderDate <= revenueDateRange.end
          );
        });
        return revenueOrders.length;
      }
    }

    return filteredAndSortedOrders.length;
  };

  const getAverageOrderValue = () => {
    const totalRevenue = parseFloat(getTotalRevenue());
    const totalOrders = getTotalOrders();

    if (totalOrders === 0) return "0.00";
    return (totalRevenue / totalOrders).toFixed(2);
  };

  const getRevenueFilterLabel = () => {
    switch (revenueFilter) {
      case "daily":
        return "Today's Revenue";
      case "weekly":
        return "This Week's Revenue";
      case "monthly":
        return "This Month's Revenue";
      case "yearly":
        return "This Year's Revenue";
      default:
        return "Total Revenue";
    }
  };

  if (!user || user.role !== "admin") return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-4 min-h-screen bg-gray-50">
      <div className="px-2 sm:px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 md:gap-0">
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <Link
            to="/admin/orders"
            className="px-4 py-2 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
          >
            Current Orders
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-sm">
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
                  {revenueFilter !== "all"
                    ? `${getRevenueFilterLabel().split("'")[0]} Orders`
                    : "Total Orders"}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {getTotalOrders()}
                </p>
                {revenueFilter !== "all" && (
                  <p className="text-xs text-gray-400">
                    {getRevenueFilterLabel().split("'")[0]} period
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
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
                  {getRevenueFilterLabel()}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${getTotalRevenue()}
                </p>
                {revenueFilter !== "all" && (
                  <p className="text-xs text-gray-400">
                    {getRevenueFilterLabel().split("'")[0]} period
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {revenueFilter !== "all"
                    ? `${getRevenueFilterLabel().split("'")[0]} Average`
                    : "Average Order Value"}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${getAverageOrderValue()}
                </p>
                {revenueFilter !== "all" && (
                  <p className="text-xs text-gray-400">
                    {getRevenueFilterLabel().split("'")[0]} period
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div>
              <label
                htmlFor="search"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Search Orders
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by order ID, customer, or product..."
                value={searchTerm}
                onChange={handleSearch}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={handleStatusFilter}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="date"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Date Range
              </label>
              <select
                id="date"
                value={dateFilter}
                onChange={handleDateFilter}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="revenue"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Revenue Period
              </label>
              <select
                id="revenue"
                value={revenueFilter}
                onChange={handleRevenueFilter}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="daily">Today</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="createdAt-desc">Date (Newest)</option>
                <option value="createdAt-asc">Date (Oldest)</option>
                <option value="id-desc">Order ID (High-Low)</option>
                <option value="id-asc">Order ID (Low-High)</option>
                <option value="total-desc">Total (High-Low)</option>
                <option value="total-asc">Total (Low-High)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="user-asc">Customer (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("id")}
                >
                  Order ID
                </th>
                <th
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("user")}
                >
                  Customer
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Products
                </th>
                <th
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("total")}
                >
                  Total
                </th>
                <th
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("status")}
                >
                  Status
                </th>
                <th
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("createdAt")}
                >
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{order.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.user?.name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.user?.email || "No email"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.orderDetails?.length || 0} items
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.orderDetails
                        ?.slice(0, 2)
                        .map(
                          (detail) =>
                            `${detail.product?.title} (${detail.quantity})`
                        )
                        .join(", ")}
                      {order.orderDetails?.length > 2 && "..."}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedOrders.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-lg text-gray-500">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                ? "No orders match your search criteria"
                : "No orders found"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
