import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { adminAPI } from "../../services/api";
import Swal from "sweetalert2";

const Categories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    const fetchCategories = async () => {
      try {
        const { data } = await adminAPI.getCategories();
        setCategories(data);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to fetch categories",
          confirmButtonColor: "#3B82F6",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddClick = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Add New Category",
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Category Name" required>
        <textarea id="swal-description" class="swal2-textarea" placeholder="Description (optional)"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Add Category",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B82F6",
      cancelButtonColor: "#6B7280",
      preConfirm: () => {
        const name = document.getElementById("swal-name").value;
        const description = document.getElementById("swal-description").value;
        if (!name.trim()) {
          Swal.showValidationMessage("Category name is required");
          return false;
        }
        return { name: name.trim(), description: description.trim() };
      },
    });

    if (formValues) {
      try {
        const { data } = await adminAPI.createCategory(formValues);
        setCategories([...categories, data]);
        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "Category has been created successfully",
          confirmButtonColor: "#10B981",
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to add category",
          confirmButtonColor: "#3B82F6",
        });
      }
    }
  };

  const handleEditClick = async (category) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Category",
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Category Name" value="${
          category.name
        }" required>
        <textarea id="swal-description" class="swal2-textarea" placeholder="Description (optional)">${
          category.description || ""
        }</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Category",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3B82F6",
      cancelButtonColor: "#6B7280",
      preConfirm: () => {
        const name = document.getElementById("swal-name").value;
        const description = document.getElementById("swal-description").value;
        if (!name.trim()) {
          Swal.showValidationMessage("Category name is required");
          return false;
        }
        return { name: name.trim(), description: description.trim() };
      },
    });

    if (formValues) {
      try {
        const { data } = await adminAPI.updateCategory(category.id, formValues);
        setCategories(
          categories.map((cat) => (cat.id === category.id ? data : cat))
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Category has been updated successfully",
          confirmButtonColor: "#10B981",
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to update category",
          confirmButtonColor: "#3B82F6",
        });
      }
    }
  };

  const handleDeleteClick = async (category) => {
    const result = await Swal.fire({
      title: "Delete Category",
      text: `Are you sure you want to delete "${category.name}"? This will also delete all products in this category.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        // Show loading state
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the category",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await adminAPI.deleteCategory(category.id);
        setCategories(categories.filter((cat) => cat.id !== category.id));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Category has been deleted successfully",
          confirmButtonColor: "#10B981",
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to delete category",
          confirmButtonColor: "#3B82F6",
        });
      }
    }
  };

  const getFilteredCategories = () => {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (!user || user.role !== "admin") return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="px-2 sm:px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 md:gap-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Category Management
          </h1>
          <button
            onClick={handleAddClick}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add New Category
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Categories
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredCategories().map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {category.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(category)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {getFilteredCategories().length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {searchTerm
                ? "No categories match your search criteria"
                : "No categories found"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
