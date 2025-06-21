import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useCart } from "../contexts/CartContext";

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlistItems, loading, error, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/wishlist" } });
    }
  }, [user, navigate]);

  const handleAddToCart = (item) => {
    if (!user) {
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }
    addToCart(item, 1);
    setMessage(`${item.title} added to cart`);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleRemoveFromWishlist = async (item) => {
    if (!user) {
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }
    try {
      await removeFromWishlist(item.product.id);
    } catch (err) {
      // Error is handled by the context
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Add some books to your wishlist to keep track of your favorites.
            </p>
            <button
              onClick={() => navigate("/books")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Books
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlistItems
              .filter((item) => item.product)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <img
                    src={`${
                      import.meta.env.VITE_API_URL?.replace("/api", "") ||
                      "http://localhost:5000"
                    }${item.image}`}
                    alt={item.title}
                    className="w-20 h-24 object-cover rounded"
                  />
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.product.title}
                    </h2>
                    <p className="text-gray-600 mb-2">
                      by {item.product.author}
                    </p>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-lg font-bold text-gray-900">
                        $
                        {(
                          item.product.sale_price || item.product.price
                        ).toFixed(2)}
                      </span>
                      {item.product.sale_price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${item.product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddToCart(item.product)}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemoveFromWishlist(item)}
                        className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
