import React, { useEffect, useState } from "react";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const BestSellingBooks = () => {
  const { fetchBestSellingProducts, loading, error } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    const getBestSellers = async () => {
      try {
        const data = await fetchBestSellingProducts();
        setBestSellers(data);
      } catch (err) {
        console.error("Failed to fetch best selling books:", err);
      }
    };
    getBestSellers();
  }, [fetchBestSellingProducts]);

  const handleAddToCart = (book) => {
    if (!user) {
      Swal.fire({
        icon: "info",
        title: "Login Required",
        text: "Please log in to add items to your cart.",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }
    addToCart(book, 1);
    Swal.fire({
      icon: "success",
      title: "Added to Cart",
      text: `${book.title} added to cart!`,
      timer: 1500,
      showConfirmButton: false,
      position: "top-end",
      toast: true,
    });
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p>Loading best selling books...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Best Selling Books
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {bestSellers.filter((book) => book.sales_count > 0).length > 0 ? (
            bestSellers
              .filter((book) => book.sales_count > 0)
              .slice(0, 4)
              .map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link to={`/products/${book.id}`}>
                    <div className="relative">
                      <img
                        src={`${
                          import.meta.env.VITE_API_URL?.replace("/api", "") ||
                          "http://localhost:5000"
                        }${book.image}`}
                        alt={book.title}
                        className="w-full h-64 object-cover"
                      />
                      {book.rating && (
                        <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full font-semibold">
                          {book.rating} ★
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-green-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                        {book.sales_count} sold
                      </div>
                      {book.sale_price && (
                        <div className="absolute bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                          SALE
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{book.title}</h3>
                    <p className="text-gray-600 mb-4">by {book.author}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">
                          $
                          {book.sale_price
                            ? book.sale_price.toFixed(2)
                            : book.price.toFixed(2)}
                        </span>
                        {book.sale_price && (
                          <span className="text-gray-400 line-through text-sm">
                            ${book.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(book)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              No best sellers found.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BestSellingBooks;
