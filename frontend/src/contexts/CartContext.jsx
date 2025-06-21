import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import Swal from "sweetalert2";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(
        (item) =>
          (item.product_id || item.id) === (product.product_id || product.id)
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          Swal.fire({
            icon: "warning",
            title: "Stock Limit",
            text: `Cannot add more than ${product.stock} of ${
              product.title
            } to cart. Only ${
              product.stock - existingItem.quantity
            } more available.`,
            confirmButtonColor: "#3B82F6",
          });
          return prevCart;
        }
        return prevCart.map((item) =>
          (item.product_id || item.id) === (product.product_id || product.id)
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      if (quantity > product.stock) {
        Swal.fire({
          icon: "warning",
          title: "Stock Limit",
          text: `Cannot add ${quantity} of ${product.title} to cart. Only ${product.stock} available.`,
          confirmButtonColor: "#3B82F6",
        });
        return prevCart;
      }

      return [
        ...prevCart,
        {
          ...product,
          product_id: product.product_id || product.id,
          quantity,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevCart) =>
      prevCart.filter((item) => (item.product_id || item.id) !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) return;

    setCartItems((prevCart) =>
      prevCart.map((item) =>
        (item.product_id || item.id) === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const calculateSubtotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = item.sale_price || item.price;
      return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    return subtotal;
  }, [calculateSubtotal]);

  const value = {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    calculateSubtotal,
    calculateTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
