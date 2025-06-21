import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Initial token check:", token ? "Present" : "Missing");

    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      console.log("Loading user data...");
      const { data } = await authAPI.getCurrentUser();
      console.log("User data loaded:", data);
      setUser(data);
      setError(null);
    } catch (err) {
      console.error("Error loading user:", err);
      setError(err.response?.data?.message || "Error loading user");
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log("Attempting login...");
      const { data } = await authAPI.login(credentials);
      console.log("Login successful, storing token...");

      // Store token
      localStorage.setItem("token", data.token);
      console.log("Token stored in localStorage");

      // Load user data
      await loadUser();
      setError(null);
      return data;
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || "Login failed";
      const errorCode = err.response?.data?.code;

      // Handle specific error cases
      if (errorCode === "USER_NOT_FOUND") {
        setError("No account found with this email. Please register first.");
      } else if (errorCode === "INVALID_PASSWORD") {
        setError("Incorrect password. Please try again.");
      } else {
        setError(errorMessage);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      console.log("Attempting registration...");
      const { data } = await authAPI.register(userData);
      console.log("Registration successful, storing token...");

      // Store token
      localStorage.setItem("token", data.token);
      console.log("Token stored in localStorage");

      // Load user data
      await loadUser();
      setError(null);
      return data;
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("Logging out...");
    localStorage.removeItem("token");
    setUser(null);
    setLoading(false);
    console.log("Token removed from localStorage");
  };

  const updateSettings = async (settings) => {
    try {
      setLoading(true);
      const { data } = await authAPI.updateSettings(settings);
      setUser(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update settings");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateSettings,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
