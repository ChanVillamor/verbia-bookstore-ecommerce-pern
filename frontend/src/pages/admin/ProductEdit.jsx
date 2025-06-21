import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useProducts } from "../../contexts/ProductContext";
import { adminAPI } from "../../services/api";
import Swal from "sweetalert2";

const ProductEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshAllProducts } = useProducts();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    price: "",
    sale_price: "",
    stock: "",
    category_ids: [],
    publisher: "",
    publicationYear: "",
    language: "",
    pages: "",
    featured: false,
    imageFile: null,
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [categoriesRes, productRes] = await Promise.all([
          adminAPI.getCategories(),
          id ? adminAPI.getProduct(id) : Promise.resolve(null),
        ]);

        setCategories(categoriesRes.data || []);
        if (productRes?.data) {
          const fetchedProductData = productRes.data;
          const newFormData = { ...formData }; // Start with default structure

          // Iterate over the keys in formData to ensure all expected fields are covered
          // and apply type conversions/null handling
          for (const key in newFormData) {
            if (fetchedProductData.hasOwnProperty(key)) {
              let value = fetchedProductData[key];

              // Handle null/undefined values: convert to empty string
              if (value === null || typeof value === "undefined") {
                newFormData[key] = "";
              } else if (
                // Convert specific numeric/boolean values to string for input fields
                key === "price" ||
                key === "sale_price" ||
                key === "stock" ||
                key === "pages" ||
                key === "publicationYear" ||
                key === "category_ids"
              ) {
                newFormData[key] = String(value);
              } else if (key === "featured") {
                // Ensure featured is a boolean
                newFormData[key] = Boolean(value);
              } else {
                newFormData[key] = value;
              }
            }
          }
          if (fetchedProductData.Categories) {
            newFormData.category_ids = fetchedProductData.Categories.map(
              (cat) => String(cat.id)
            );
          }
          setFormData(newFormData);
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to fetch data",
          confirmButtonColor: "#3B82F6",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleChange = (e) => {
    const { name, value, type, checked, multiple, options } = e.target;
    if (name === "category_ids" && type === "checkbox") {
      setFormData((prev) => {
        const id = value;
        const already = prev.category_ids.includes(id);
        return {
          ...prev,
          category_ids: checked
            ? [...prev.category_ids, id]
            : prev.category_ids.filter((catId) => catId !== id),
        };
      });
    } else if (name === "category_ids" && multiple) {
      // fallback for multi-select (should not be used now)
      const selected = Array.from(options)
        .filter((opt) => opt.selected && opt.value)
        .map((opt) => opt.value);
      setFormData((prev) => ({ ...prev, category_ids: selected }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create FormData object for file upload
      const submitData = new FormData();

      // Convert numeric values to proper types
      const numericFields = [
        "price",
        "sale_price",
        "stock",
        "pages",
        "publicationYear",
      ];
      const booleanFields = ["featured"];

      // Append all form fields to FormData
      Object.keys(formData).forEach((key) => {
        if (key === "imageFile" && formData[key]) {
          submitData.append("image", formData[key]);
        } else if (key !== "imageFile") {
          let value = formData[key];

          // Convert numeric fields
          if (numericFields.includes(key)) {
            value = value === "" ? "0" : value;
          }

          // Convert boolean fields
          if (booleanFields.includes(key)) {
            value = value ? "true" : "false";
          }

          // Special handling for category_ids
          if (key === "category_ids") {
            const validIds = value.filter((id) => id && id !== "");
            if (validIds.length > 0) {
              validIds.forEach((id) => submitData.append("category_ids", id));
            }
            return; // Skip the default append for category_ids
          }

          submitData.append(key, value);
        }
      });

      // Log the form data for debugging
      console.log("Submitting form data:", {
        title: submitData.get("title"),
        author: submitData.get("author"),
        description: submitData.get("description"),
        price: submitData.get("price"),
        sale_price: submitData.get("sale_price"),
        stock: submitData.get("stock"),
        category_ids: submitData.get("category_ids"),
        publisher: submitData.get("publisher"),
        publicationYear: submitData.get("publicationYear"),
        language: submitData.get("language"),
        pages: submitData.get("pages"),
        featured: submitData.get("featured"),
        hasImageFile: !!formData.imageFile,
      });

      if (id) {
        await adminAPI.updateProduct(id, submitData);
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Product has been updated successfully",
          confirmButtonColor: "#10B981",
        });
      } else {
        await adminAPI.createProduct(submitData);
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "Product has been created successfully",
          confirmButtonColor: "#10B981",
        });
      }
      await refreshAllProducts();
      navigate("/admin/products");
    } catch (err) {
      console.error("Error submitting form:", err);
      let errorMessage = "Failed to save product";

      if (err.response?.data?.errors) {
        errorMessage = err.response.data.errors.map((e) => e.msg).join(", ");
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">
          {id ? "Edit Product" : "Add New Product"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Author <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name="category_ids"
                        value={category.id}
                        checked={formData.category_ids.includes(
                          String(category.id)
                        )}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="px-3 py-2 w-full rounded-md border"
                ></textarea>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Featured
                </label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="mt-2 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mark this book to be featured on the homepage (up to 3).
                </p>
              </div>
            </div>
          </div>

          {/* Pricing and Stock */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">Pricing and Stock</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Sale Price
                </label>
                <input
                  type="number"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">Image</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Image File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!id}
                  className="w-full"
                />
              </div>
              {(formData.image || formData.imageFile) && (
                <div className="mt-2">
                  <img
                    src={
                      formData.imageFile
                        ? URL.createObjectURL(formData.imageFile)
                        : formData.image
                        ? `${
                            import.meta.env.VITE_API_URL?.replace("/api", "") ||
                            "http://localhost:5000"
                          }${formData.image}`
                        : ""
                    }
                    alt="Current product"
                    className="object-cover w-32 h-32 rounded"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">Additional Details</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Publisher
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Publication Year
                </label>
                <input
                  type="number"
                  name="publicationYear"
                  value={formData.publicationYear}
                  onChange={handleChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Language
                </label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Pages
                </label>
                <input
                  type="number"
                  name="pages"
                  value={formData.pages}
                  onChange={handleChange}
                  min="1"
                  className="px-3 py-2 w-full rounded-md border"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="px-4 py-2 rounded-md border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEdit;
