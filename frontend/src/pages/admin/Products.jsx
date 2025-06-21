import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { adminAPI } from "../../services/api";
import Swal from "sweetalert2";
import { getImageSrc } from "../../utils/helpers";

const Products = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          adminAPI.getAllProducts(),
          adminAPI.getCategories(),
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
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
  }, [user]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleDeleteClick = async (product) => {
    const result = await Swal.fire({
      title: "Delete Product",
      text: `Are you sure you want to delete "${product.title}"? This action cannot be undone and will also delete all related order details, wishlist items, and reviews.`,
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
          text: "Please wait while we delete the product",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const response = await adminAPI.deleteProduct(product.id);

        // Remove product from state
        setProducts(products.filter((p) => p.id !== product.id));

        // Show success message
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: response.data.message,
          confirmButtonColor: "#10B981",
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to delete product",
          confirmButtonColor: "#3B82F6",
        });
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      (product.Categories &&
        product.Categories.some(
          (cat) => cat.id === parseInt(selectedCategory)
        ));
    return matchesSearch && matchesCategory;
  });

  if (!user || user.role !== "admin") return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-4 min-h-screen bg-gray-50">
      <div className="px-2 mx-auto max-w-7xl sm:px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 justify-between items-center mb-8 md:flex-row md:gap-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <Link
            to="/admin/products/new"
            className="px-4 py-2 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
          >
            Add New Product
          </Link>
        </div>

        {/* Search and Filter Section */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="search"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Search Products
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={handleSearch}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="category"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Filter by Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12">
                        <img
                          className="object-cover w-12 h-12 rounded-lg"
                          src={getImageSrc(product.image)}
                          alt={product.title}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.author}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.Categories && product.Categories.length > 0
                        ? product.Categories.map((cat) => cat.name).join(", ")
                        : "Uncategorized"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${product.price}
                      {product.sale_price && (
                        <span className="ml-2 text-red-600">
                          ${product.sale_price}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <Link
                      to={`/admin/products/${product.id}`}
                      className="mr-4 text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(product)}
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

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-lg text-gray-500">
              {searchTerm || selectedCategory !== "all"
                ? "No products match your search criteria"
                : "No products found"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
