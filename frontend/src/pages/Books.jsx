import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { getImageSrc } from "../utils/helpers";

const Books = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchProducts, loading } = useProducts();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, checkWishlistItem } =
    useWishlist();

  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    genre: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
  });
  const [wishlistItems, setWishlistItems] = useState(new Set());

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts(filters);
        setProducts(data);

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
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation(); // Prevent navigation when clicking the button
    addToCart(product, 1);
  };

  const handleWishlistToggle = async (e, product) => {
    e.stopPropagation(); // Prevent navigation when clicking the button
    if (!user) {
      navigate("/login", { state: { from: "/books" } });
      return;
    }

    try {
      if (wishlistItems.has(product.id)) {
        await removeFromWishlist(product.id);
        setWishlistItems((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      } else {
        await addToWishlist(product);
        setWishlistItems((prev) => new Set([...prev, product.id]));
      }
    } catch (err) {
      // Error is handled by the context
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-brown mb-8">All Books</h1>

        {/* Filters */}
        <div className="bg-sepia rounded-lg shadow-sm p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              name="genre"
              value={filters.genre}
              onChange={handleFilterChange}
              className="rounded-lg border-brown focus:ring-gold focus:border-gold bg-parchment text-brown"
            >
              <option value="">All Genres</option>
              <option value="fiction">Fiction</option>
              <option value="non-fiction">Non-Fiction</option>
              <option value="mystery">Mystery</option>
              <option value="science-fiction">Science Fiction</option>
              <option value="fantasy">Fantasy</option>
            </select>

            <input
              type="number"
              name="minPrice"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="rounded-lg border-brown focus:ring-gold focus:border-gold bg-parchment text-brown"
            />

            <input
              type="number"
              name="maxPrice"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="rounded-lg border-brown focus:ring-gold focus:border-gold bg-parchment text-brown"
            />

            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="rounded-lg border-brown focus:ring-gold focus:border-gold bg-parchment text-brown"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className="bg-sepia rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-brown"
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
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-sm">
                    {Math.round(
                      ((product.price - product.sale_price) / product.price) *
                        100
                    )}
                    % OFF
                  </div>
                )}
                <button
                  onClick={(e) => handleWishlistToggle(e, product)}
                  className="absolute top-2 left-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 ${
                      wishlistItems.has(product.id)
                        ? "text-red-500 fill-current"
                        : "text-gray-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-brown mb-2">
                  {product.title}
                </h3>
                <p className="text-brown mb-2">by {product.author}</p>
                <p className="text-sm text-ink mb-2">
                  {product.Categories && product.Categories.length > 0
                    ? product.Categories.map((cat) => cat.name).join(", ")
                    : "Uncategorized"}
                </p>
                <p className="text-sm text-ink mb-2">Stock: {product.stock}</p>
                {product.description && (
                  <p className="text-sm text-ink mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    {product.sale_price ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-burgundy">
                          ${product.sale_price}
                        </span>
                        <span className="text-sm text-brown line-through">
                          ${product.price}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-brown">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="bg-brown text-parchment px-4 py-2 rounded-lg hover:bg-brown-dark transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Books;
