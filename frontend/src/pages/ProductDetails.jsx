import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useReviews } from "../contexts/ReviewContext";
import { useAuth } from "../contexts/AuthContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchProductById, loading: productLoading } = useProducts();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, checkWishlistItem } =
    useWishlist();
  const {
    reviews,
    loading: reviewsLoading,
    fetchProductReviews,
    createReview,
    deleteReview,
  } = useReviews();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProductById(id);
        setProduct(data);
        if (user) {
          const inWishlist = await checkWishlistItem(id);
          setIsInWishlist(inWishlist);
        }
      } catch (err) {
        navigate("/404");
      }
    };
    loadProduct();
    fetchProductReviews(id);
  }, [id, user]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    try {
      if (isInWishlist) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      setIsInWishlist(!isInWishlist);
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      // Error is handled by the context
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    try {
      await createReview(id, reviewForm.rating, reviewForm.comment);
      setReviewForm({ rating: 5, comment: "" });
      setReviewError("");
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review");
    }
  };

  if (productLoading || !product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8 min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="overflow-hidden bg-white rounded-lg shadow-sm">
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Product Image */}
              <div className="relative">
                <img
                  src={`${
                    import.meta.env.VITE_API_URL?.replace("/api", "") ||
                    "http://localhost:5000"
                  }${product.image}`}
                  alt={product.title}
                  className="object-cover w-full h-96 rounded-lg"
                />
                {product.sale_price && (
                  <div className="absolute top-4 right-4 px-3 py-1 text-white bg-red-600 rounded-full">
                    {Math.round(
                      ((product.price - product.sale_price) / product.price) *
                        100
                    )}
                    % OFF
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.title}
                  </h1>
                  <p className="mt-2 text-xl text-gray-600">
                    by {product.author}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-gray-900">
                    ${Number(product.sale_price || product.price).toFixed(2)}
                  </span>
                  {product.sale_price && (
                    <span className="text-lg text-gray-500 line-through">
                      ${Number(product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                <p className="text-gray-600">{product.description}</p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      -
                    </button>
                    <span className="text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0 || quantity > product.stock}
                      className="flex-1 px-6 py-3 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                    <button
                      onClick={handleWishlistToggle}
                      className={`px-6 py-3 rounded-lg transition-colors ${
                        isInWishlist
                          ? "text-red-600 bg-red-100 hover:bg-red-200"
                          : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {isInWishlist
                        ? "Remove from Wishlist"
                        : "Add to Wishlist"}
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Book Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="text-gray-900">
                        {product.Categories && product.Categories.length > 0
                          ? product.Categories.map((cat) => cat.name).join(", ")
                          : "Uncategorized"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Availability</p>
                      <p className="text-gray-900">
                        {product.stock > 0
                          ? `In Stock (${product.stock})`
                          : "Out of Stock"}
                      </p>
                    </div>
                    {product.publisher && (
                      <div>
                        <p className="text-sm text-gray-500">Publisher</p>
                        <p className="text-gray-900">{product.publisher}</p>
                      </div>
                    )}
                    {product.publicationYear && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Publication Year
                        </p>
                        <p className="text-gray-900">
                          {product.publicationYear}
                        </p>
                      </div>
                    )}
                    {product.language && (
                      <div>
                        <p className="text-sm text-gray-500">Language</p>
                        <p className="text-gray-900">{product.language}</p>
                      </div>
                    )}
                    {product.pages && (
                      <div>
                        <p className="text-sm text-gray-500">Pages</p>
                        <p className="text-gray-900">{product.pages}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="p-6 border-t md:p-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Customer Reviews
            </h2>

            {/* Review Form */}
            {user && (
              <form onSubmit={handleReviewSubmit} className="mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rating
                    </label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          rating: Number(e.target.value),
                        }))
                      }
                      className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} {rating === 1 ? "Star" : "Stars"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Review
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      rows={4}
                      className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Write your review..."
                    />
                  </div>
                  {reviewError && (
                    <p className="text-sm text-red-600">{reviewError}</p>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => {
                  // Debug log for review object
                  console.log("Review object:", review);
                  return (
                    <div
                      key={review.id}
                      className="pb-6 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="font-medium text-gray-900">
                            {review.user_name}
                          </span>
                        </div>
                        {user && user.id === review.user_id && (
                          <button
                            onClick={() => review.id && deleteReview(review.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={!review.id}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-gray-600">{review.comment}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {(review.createdAt || review.created_at) &&
                        !isNaN(new Date(review.createdAt || review.created_at))
                          ? new Date(
                              review.createdAt || review.created_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                No reviews yet. Be the first to review this book!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
