import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import Swal from "sweetalert2";

const ReviewContext = createContext();

export const useReviews = () => {
  return useContext(ReviewContext);
};

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchProductReviews = async (productId, page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/${productId}/reviews?page=${page}&limit=${limit}`
      );
      setReviews(response.data.reviews);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (productId, rating, comment) => {
    if (!user) {
      setError("Please login to leave a review");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const reviewData = { rating, comment };
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/${productId}/reviews`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReviews((prev) => [response.data, ...prev]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create review");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (reviewId, rating, comment) => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const reviewData = { rating, comment };
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reviews/${reviewId}`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReviews((prev) =>
        prev.map((review) =>
          review.review_id === reviewId ? response.data : review
        )
      );
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update review");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
      setError(null);
      Swal.fire({
        icon: "success",
        title: "Review deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete review");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to delete review",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reviews/my-reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReviews(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user reviews");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    reviews,
    loading,
    error,
    fetchProductReviews,
    createReview,
    updateReview,
    deleteReview,
    fetchUserReviews,
  };

  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  );
};
