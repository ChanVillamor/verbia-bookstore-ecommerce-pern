import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  useEffect(() => {
    console.log(
      "Profile component - user from AuthContext (inside useEffect):",
      user
    );
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || "",
        },
      });
    }
  }, [user]);

  console.log(
    "Profile component - formData (after useEffect, for rendering):",
    formData
  );
  console.log("Profile component - user.address:", user?.address);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Simplified rendering logic
  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Profile Test Page
        </h1>

        {user ? (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <p className="text-lg font-semibold">
              Welcome, {user.name || "User"}!
            </p>
            <p>User ID: {user.id}</p>
            <p>Email: {user.email}</p>
            {user.phone && <p>Phone: {user.phone}</p>}
            {user.address && (
              <div>
                <p className="font-medium">Address:</p>
                <p>{user.address.street}</p>
                <p>
                  {user.address.city}, {user.address.state}{" "}
                  {user.address.zipCode}
                </p>
                <p>{user.address.country}</p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Full User Object: {JSON.stringify(user, null, 2)}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Please log in to view your profile
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
