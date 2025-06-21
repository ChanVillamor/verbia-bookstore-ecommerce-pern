import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { productsAPI } from "../services/api"; // Import productsAPI

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    sort: "createdAt:desc",
    page: 1,
    limit: 12,
  });

  const handleApiError = (err, defaultMessage) => {
    console.error(defaultMessage, err);
    const errorMessage =
      err.response?.data?.message || err.message || defaultMessage;
    setError(errorMessage);
    return [];
  };

  const fetchProducts = useCallback(
    async (paramsOverride = {}) => {
      try {
        setLoading(true);
        setError(null);
        const currentFilters = { ...filters, ...paramsOverride };
        const { category, search, sort, page, limit } = currentFilters;

        const params = {
          ...(category && { category }),
          ...(search && { search }),
          ...(sort && { sort }),
          page,
          limit,
        };

        console.log("Fetching products with params:", params);
        const response = await productsAPI.getAll(params);
        const productsData = response.data.products || response.data;
        setProducts(productsData);
        return productsData;
      } catch (err) {
        return handleApiError(err, "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const fetchSaleProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching sale products");
      const response = await productsAPI.getSale();
      const productsData = response.data.products || response.data;
      setSaleProducts(productsData);
      return productsData;
    } catch (err) {
      return handleApiError(err, "Failed to fetch sale products");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBestSellingProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching best-selling products");
      const response = await productsAPI.getBestSelling();
      const productsData = response.data.products || response.data;
      setProducts(productsData);
      return productsData;
    } catch (err) {
      return handleApiError(err, "Failed to fetch best-selling products");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching featured products");
      const response = await productsAPI.getFeatured();
      const productsData = response.data.products || response.data;
      setFeaturedProducts(productsData);
      return productsData;
    } catch (err) {
      return handleApiError(err, "Failed to fetch featured products");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching product by ID:", id);
      const response = await productsAPI.getById(id);
      return response.data;
    } catch (err) {
      handleApiError(err, "Failed to fetch product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const refreshAllProducts = useCallback(async () => {
    try {
      await Promise.all([
        fetchProducts(),
        fetchSaleProducts(),
        fetchBestSellingProducts(),
        fetchFeaturedProducts(),
      ]);
    } catch (err) {
      console.error("Error refreshing products:", err);
    }
  }, [
    fetchProducts,
    fetchSaleProducts,
    fetchBestSellingProducts,
    fetchFeaturedProducts,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const value = {
    products,
    saleProducts,
    featuredProducts,
    loading,
    error,
    filters,
    updateFilters,
    fetchProducts,
    fetchSaleProducts,
    fetchBestSellingProducts,
    fetchFeaturedProducts,
    fetchProductById,
    refreshAllProducts,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};
