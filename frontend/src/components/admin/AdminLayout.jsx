import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  const navigation = [
    { name: "Dashboard", href: "/admin" },
    { name: "Products", href: "/admin/products" },
    { name: "Orders", href: "/admin/orders" },
    { name: "Order History", href: "/admin/order-history" },
    { name: "Categories", href: "/admin/categories" },
    { name: "Users", href: "/admin/users" },
  ];

  // Close sidebar on ESC
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  // Focus trap for sidebar
  useEffect(() => {
    if (sidebarOpen && sidebarRef.current) {
      sidebarRef.current.focus();
    }
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky top bar for hamburger on mobile */}
      <div className="flex sticky top-0 z-50 justify-between items-center px-2 h-14 bg-white shadow md:hidden">
        <button
          className="p-2 bg-white rounded-md shadow"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="text-lg font-semibold text-gray-800">Admin Panel</span>
      </div>
      <div className="flex flex-row">
        {/* Sidebar & Overlay */}
        {/* Overlay for mobile */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-200 md:hidden ${
            sidebarOpen
              ? "bg-black bg-opacity-40"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
        <aside
          ref={sidebarRef}
          tabIndex={sidebarOpen ? 0 : -1}
          className={`fixed z-50 inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 md:min-h-screen md:bg-white md:shadow-md
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            flex flex-col justify-between
          `}
          aria-label="Admin sidebar"
        >
          <div>
            <div className="p-4 border-b border-gray-100">
              <h2 className="hidden text-xl font-semibold text-gray-800 md:block">
                Admin Panel
              </h2>
              <p className="text-sm text-gray-600 truncate">{user?.email}</p>
            </div>
            <nav className="overflow-y-auto flex-1 mt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-4 py-2 text-sm rounded transition-colors mb-1
                    ${
                      location.pathname === item.href
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          {/* User actions at the bottom */}
          <div className="p-4 space-y-2 border-t border-gray-100">
            <Link
              to="/"
              className="block px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-50"
              onClick={() => setSidebarOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-50"
              onClick={() => setSidebarOpen(false)}
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="block px-4 py-2 w-full text-sm text-left text-red-600 rounded hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
          {/* Close button on mobile */}
          <button
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-md md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </aside>
        {/* Main content */}
        <div className="flex-1 p-2 ml-20 transition-all duration-200">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
