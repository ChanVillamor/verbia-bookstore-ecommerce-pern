import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productsAPI, categoriesAPI } from "../services/api";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { getImageSrc } from "../utils/helpers";

const BookCollection = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlistItems } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    genre: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesAPI.getAll();
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError("");
      try {
        let res;
        let books = [];
        const params = {};
        if (filters.genre) params.category = filters.genre;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.sortBy === "best_selling") {
          res = await productsAPI.getBestSelling();
          books = res.data.products || res.data;
        } else if (filters.sortBy === "sales") {
          res = await productsAPI.getSale();
          books = res.data.products || res.data;
        } else {
          if (filters.sortBy && filters.sortBy !== "relevance")
            params.sort = filters.sortBy;
          res = await productsAPI.getAll(params);
          books = res.data.products || res.data;
        }
        // Apply genre/price filters client-side for best_selling and sales
        if (["best_selling", "sales"].includes(filters.sortBy)) {
          if (filters.genre) {
            books = books.filter(
              (book) =>
                book.Categories &&
                book.Categories.some(
                  (cat) => String(cat.id) === String(filters.genre)
                )
            );
          }
          if (filters.minPrice) {
            books = books.filter(
              (book) =>
                Number(book.sale_price || book.price) >=
                Number(filters.minPrice)
            );
          }
          if (filters.maxPrice) {
            books = books.filter(
              (book) =>
                Number(book.sale_price || book.price) <=
                Number(filters.maxPrice)
            );
          }
        }
        setBooks(books);
      } catch (err) {
        setError("Failed to load books");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = (book) => {
    addToCart(book, 1);
  };

  const handleWishlist = (book) => {
    if (!user) return navigate("/login");
    if (wishlistItems?.some((item) => item.product_id === book.id)) {
      removeFromWishlist(book.id);
    } else {
      addToWishlist(book.id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="py-8">
      <h1 className="mb-6 text-3xl font-bold text-center">Book Collection</h1>

      {/* Filters */}
      <div className="p-4 px-4 mx-auto mb-8 max-w-7xl bg-white rounded-lg shadow-sm sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <select
            name="genre"
            value={filters.genre}
            onChange={handleFilterChange}
            className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Genres</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />

          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="best_selling">Best Selling</option>
            <option value="sales">Sales</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 mx-auto max-w-7xl sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:px-6 lg:px-8">
        {books.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            No books found.
          </div>
        )}
        {books.map((book) => (
          <div
            key={book.id}
            className="flex flex-col p-4 bg-white rounded-lg shadow"
          >
            <div className="relative">
              <img
                src={getImageSrc(book.image)}
                alt={book.title}
                className="object-cover mb-4 w-full h-48 rounded"
                onClick={() => navigate(`/products/${book.id}`)}
                style={{ cursor: "pointer" }}
              />
              {book.sale_price && (
                <div className="absolute top-2 right-2 px-2 py-1 text-sm text-white bg-red-600 rounded-full">
                  {Math.round(
                    ((book.price - book.sale_price) / book.price) * 100
                  )}
                  % OFF
                </div>
              )}
              {typeof book.sales_count !== "undefined" && (
                <div className="absolute bottom-2 left-2 px-2 py-1 text-xs text-white bg-indigo-600 rounded-full shadow">
                  {book.sales_count} sold
                </div>
              )}
            </div>
            <h2 className="mb-1 text-lg font-semibold">{book.title}</h2>
            <p className="mb-2 text-gray-600">by {book.author}</p>
            <p className="mb-2 text-sm text-gray-500">
              {book.Categories && book.Categories.length > 0
                ? book.Categories.map((cat) => cat.name).join(", ")
                : "Uncategorized"}
            </p>
            <div className="flex-1" />
            <div className="flex justify-between items-center mt-2">
              <span className="text-lg font-bold text-indigo-600">
                ${Number(book.sale_price || book.price).toFixed(2)}
              </span>
              {book.sale_price && (
                <span className="text-sm text-gray-500 line-through">
                  ${Number(book.price).toFixed(2)}
                </span>
              )}
              <button
                onClick={() => handleAddToCart(book)}
                className="px-3 py-1 ml-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                Add to Cart
              </button>
              <button
                onClick={() => handleWishlist(book)}
                className={`ml-2 px-2 py-1 rounded text-sm ${
                  wishlistItems?.some((item) => item.product_id === book.id)
                    ? "bg-pink-100 text-pink-600"
                    : "bg-gray-100 text-gray-500"
                }`}
                title={
                  wishlistItems?.some((item) => item.product_id === book.id)
                    ? "Remove from Wishlist"
                    : "Add to Wishlist"
                }
              >
                <span role="img" aria-label="heart">
                  ❤️
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookCollection;
