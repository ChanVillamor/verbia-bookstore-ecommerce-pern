import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { productsAPI } from "../services/api";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { getImageSrc } from "../utils/helpers";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlistItems } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setBooks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await productsAPI.getAll({ search: query });
        setBooks(res.data.products || res.data);
      } catch (err) {
        setError("Failed to load search results");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleAddToCart = (book) => {
    addToCart(book, 1);
  };

  const handleWishlist = (book) => {
    if (!user) return navigate("/login");
    if (wishlistItems?.some((item) => item.product_id === book.id)) {
      removeFromWishlist(book.id);
    } else {
      addToWishlist(book);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Search Results for "{query}"
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {books.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            No books found matching your search.
          </div>
        ) : (
          books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col"
            >
              <div className="relative">
                <img
                  src={getImageSrc(book.image)}
                  alt={book.title}
                  className="h-48 w-full object-cover rounded mb-4"
                  onClick={() => navigate(`/products/${book.id}`)}
                  style={{ cursor: "pointer" }}
                />
                {book.sale_price && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-sm">
                    {Math.round(
                      ((book.price - book.sale_price) / book.price) * 100
                    )}
                    % OFF
                  </div>
                )}
              </div>
              <h2 className="text-lg font-semibold mb-1">{book.title}</h2>
              <p className="text-gray-600 mb-2">by {book.author}</p>
              <div className="flex-1" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-indigo-600 font-bold text-lg">
                  ${Number(book.sale_price || book.price).toFixed(2)}
                </span>
                {book.sale_price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${Number(book.price).toFixed(2)}
                  </span>
                )}
                <button
                  onClick={() => handleAddToCart(book)}
                  className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
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
          ))
        )}
      </div>
    </div>
  );
};

export default Search;
