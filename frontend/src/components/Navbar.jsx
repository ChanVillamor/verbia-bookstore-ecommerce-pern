import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      setIsMobileMenuOpen(false); // Close mobile menu after search
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMobileMenuOpen(false);
  };

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalWishlistItems = wishlistItems.length;

  return (
    <div
      className={`flex sticky top-0 z-50 justify-between items-center px-6 py-6 font-medium shadow-sm transition-all duration-300 ${
        scrolled ? "backdrop-blur bg-white/70" : "bg-white"
      }`}
    >
      <Link to="/">
        <div className="flex gap-2 items-center">
          <img src={assets.book_logo} alt="Logo" className="w-10" />
          <span className="text-2xl italic font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 drop-shadow-sm select-none">
            Verbia
          </span>
        </div>
      </Link>

      <ul className="hidden gap-5 text-sm text-gray-800 sm:flex">
        <NavLink
          to="/"
          className="flex flex-col gap-2 items-center"
          activeclassname="active"
        >
          <p className="text-lg">Home</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-900 hidden" />
        </NavLink>
        <NavLink
          to="/books"
          className="flex flex-col gap-2 items-center"
          activeclassname="active"
        >
          <p className="text-lg">Books</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-900 hidden" />
        </NavLink>
        <NavLink
          to="/about"
          className="flex flex-col gap-2 items-center"
          activeclassname="active"
        >
          <p className="text-lg">About</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-900 hidden" />
        </NavLink>
        <NavLink
          to="/contact"
          className="flex flex-col gap-2 items-center"
          activeclassname="active"
        >
          <p className="text-lg">Contact</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-900 hidden" />
        </NavLink>
      </ul>

      <div className="flex gap-4 items-center">
        <form
          onSubmit={handleSearch}
          className="hidden relative items-center sm:flex"
        >
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 pr-10 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <img src={assets.search_icon} alt="Search" className="w-5 h-5" />
          </button>
        </form>

        <div className="relative group">
          <img
            src={assets.user_icon}
            className="w-7 cursor-pointer"
            alt="user-icon"
          />
          <div className="hidden absolute right-0 z-50 pt-4 group-hover:block dropdown-menu">
            <div className="flex flex-col gap-2 px-5 py-3 w-36 bg-white rounded border border-gray-200 shadow-lg">
              {user ? (
                <>
                  <Link
                    to="/settings"
                    className="cursor-pointer hover:text-indigo-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="cursor-pointer hover:text-indigo-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="cursor-pointer hover:text-indigo-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <p
                    className="cursor-pointer hover:text-indigo-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </p>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="cursor-pointer hover:text-indigo-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="cursor-pointer hover:text-indigo-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <Link to="/wishlist" className="relative">
          <img
            src={assets.save_icon}
            className="w-7 min-w-7"
            alt="wishlist-icon"
          />
          {totalWishlistItems > 0 && (
            <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-red-600 text-white aspect-square rounded-full text-[8px]">
              {totalWishlistItems}
            </p>
          )}
        </Link>

        <Link to="/cart" className="relative">
          <img src={assets.cart_icon} className="w-7 min-w-7" alt="cart-icon" />
          {totalCartItems > 0 && (
            <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-red-600 text-white aspect-square rounded-full text-[8px]">
              {totalCartItems}
            </p>
          )}
        </Link>

        <img
          onClick={() => setIsMobileMenuOpen(true)}
          src={assets.menu_icon}
          className="w-7 cursor-pointer sm:hidden"
          alt="menu-icon"
        />
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full bg-white transition-all duration-300 ease-in-out z-[100] transform ${
          isMobileMenuOpen ? "w-full translate-x-0" : "w-0 translate-x-full"
        }`}
      >
        <div className="flex flex-col p-4 h-full text-gray-700">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex gap-4 items-center p-3 mb-6 cursor-pointer"
          >
            <img
              src={assets.dropdown_icon}
              className="w-6 h-6 font-semibold rotate-90"
              alt="Close menu"
            />
            <p>Back</p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-4 px-3 mb-6"
          >
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
            >
              Search
            </button>
          </form>

          <NavLink
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 pl-6 border-b border-gray-100 hover:bg-gray-50"
            to="/"
          >
            Home
          </NavLink>
          <NavLink
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 pl-6 border-b border-gray-100 hover:bg-gray-50"
            to="/books"
          >
            Books
          </NavLink>
          <NavLink
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 pl-6 border-b border-gray-100 hover:bg-gray-50"
            to="/about"
          >
            About
          </NavLink>
          <NavLink
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 pl-6 border-b border-gray-100 hover:bg-gray-50"
            to="/contact"
          >
            Contact
          </NavLink>

          {/* Mobile User/Auth Links */}
          <div className="pt-6 mt-auto border-t border-gray-100">
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/settings"
                  className="py-2 pl-6 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  to="/orders"
                  className="py-2 pl-6 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Orders
                </Link>
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="py-2 pl-6 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <p
                  className="py-2 pl-6 text-red-600 cursor-pointer hover:bg-gray-50"
                  onClick={handleLogout}
                >
                  Logout
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  className="py-2 pl-6 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="py-2 pl-6 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
