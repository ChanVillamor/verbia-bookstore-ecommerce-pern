import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="text-white bg-gray-900">
      <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">About Us</h3>
            <p className="text-gray-400">
              Your one-stop destination for all your book needs. We offer a wide
              selection of books across various genres.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/books"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Books
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: verbia@bookstore.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Book Street, Reading City</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Newsletter</h3>
            <p className="mb-4 text-gray-400">
              Subscribe to our newsletter for updates and special offers.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-12 text-center text-gray-400 border-t border-gray-800">
          <p>
            &copy; {new Date().getFullYear()} Book Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
