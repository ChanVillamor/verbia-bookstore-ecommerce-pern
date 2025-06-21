import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { getImageSrc } from "../utils/helpers";

const Category = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchProducts, loading } = useProducts();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, checkWishlistItem } =
    useWishlist();

  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
  });
  const [wishlistItems, setWishlistItems] = useState(new Set());

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts({
          category,
          ...filters,
        });
        setProducts(data);

        // Check wishlist status for each product
        if (user) {
          const wishlistStatus = await Promise.all(
            data.map((product) => checkWishlistItem(product.id))
          );
          setWishlistItems(
            new Set(
              data
                .filter((_, index) => wishlistStatus[index])
                .map((product) => product.id)
            )
          );
        }
      } catch (err) {
        // Error is handled by the context
      }
    };

    loadProducts();
  }, [category, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  const handleWishlistToggle = async (productId) => {
    if (!user) {
      navigate("/login", { state: { from: `/category/${category}` } });
      return;
    }

    try {
      if (wishlistItems.has(productId)) {
        await removeFromWishlist(productId);
        setWishlistItems((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await addToWishlist(productId);
        setWishlistItems((prev) => new Set([...prev, productId]));
      }
    } catch (err) {
      // Error is handled by the context
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">
            {category.replace("-", " ")}
          </h1>
          <div className="flex items-center space-x-4">
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Filters
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price Range
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm md:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-500">
                  No books found in this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="relative">
                      <img
                        src={getImageSrc(product.image)}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded"
                        onClick={() => navigate(`/products/${product.id}`)}
                        style={{ cursor: "pointer" }}
                      />
                      {product.sale_price && (
                        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full">
                          {Math.round(
                            ((product.price - product.sale_price) /
                              product.price) *
                              100
                          )}
                          % OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        {product.title}
                      </h2>
                      <p className="text-gray-600 mb-2">by {product.author}</p>
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-lg font-bold text-gray-900">
                          ${(product.sale_price || product.price).toFixed(2)}
                        </span>
                        {product.sale_price && (
                          <span className="text-sm text-gray-500 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleWishlistToggle(product.id)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            wishlistItems.has(product.id)
                              ? "bg-red-100 text-red-600 hover:bg-red-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {wishlistItems.has(product.id) ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
