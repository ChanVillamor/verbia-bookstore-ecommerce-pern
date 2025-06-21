import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { wishlistAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await wishlistAPI.getAll();
      console.log("Wishlist response:", response.data);
      setWishlistItems(response.data);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToWishlist = useCallback(
    async (productId) => {
      if (!user) {
        setError("Please login to add items to wishlist");
        return;
      }

      try {
        setError(null);
        console.log("Adding to wishlist:", productId);
        const response = await wishlistAPI.add(productId);
        console.log("Add to wishlist response:", response.data);
        await fetchWishlist(); // Refresh the wishlist
        return true;
      } catch (err) {
        console.error("Failed to add to wishlist:", err);
        setError(err.response?.data?.message || err.message);
        throw err; // Re-throw to handle in the component
      }
    },
    [user, fetchWishlist]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!user) {
        setError("Please login to remove items from wishlist");
        return;
      }

      try {
        setError(null);
        console.log("Removing from wishlist:", productId);
        await wishlistAPI.remove(productId);
        setWishlistItems((prev) =>
          prev.filter((item) => item.product.id !== productId)
        );
        return true;
      } catch (err) {
        console.error("Failed to remove from wishlist:", err);
        setError(err.response?.data?.message || err.message);
        throw err;
      }
    },
    [user]
  );

  const checkWishlistItem = useCallback(
    async (productId) => {
      if (!user) return false;

      try {
        const response = await wishlistAPI.check(productId);
        return response.data.inWishlist;
      } catch (err) {
        console.error("Failed to check wishlist status:", err);
        setError(
          err.response?.data?.message || "Failed to check wishlist status"
        );
        return false;
      }
    },
    [user]
  );

  useEffect(() => {
    fetchWishlist();
  }, [user, fetchWishlist]);

  const value = {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    checkWishlistItem,
    fetchWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
