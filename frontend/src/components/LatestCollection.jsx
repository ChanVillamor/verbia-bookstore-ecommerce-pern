import React, { useEffect, useState } from "react";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const LatestCollection = () => {
  const { fetchProducts, loading, error } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [latestBooks, setLatestBooks] = useState([]);

  useEffect(() => {
    const getLatestBooks = async () => {
      try {
        // Assuming fetchProducts can take sorting and limit parameters
        const data = await fetchProducts({
          sortBy: "createdAt",
          sortOrder: "desc",
          limit: 4,
        });
        setLatestBooks(data);
      } catch (err) {
        console.error("Failed to fetch latest books:", err);
      }
    };
    getLatestBooks();
  }, [fetchProducts]);

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
      <section className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto text-center">
          <p>Loading latest books...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container px-4 mx-auto">
        <h2 className="mb-12 text-3xl font-bold text-center">
          Latest Collection
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {latestBooks.length > 0 ? (
            latestBooks.map((book) => (
              <div
                key={book.id}
                className="overflow-hidden bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg"
              >
                <Link to={`/products/${book.id}`}>
                  <div className="relative">
                    <img
                      src={`${
                        import.meta.env.VITE_API_URL?.replace("/api", "") ||
                        "http://localhost:5000"
                      }${book.image}`}
                      alt={book.title}
                      className="object-cover w-full h-64"
                    />
                    {book.sale_price && (
                      <div className="absolute top-4 right-4 px-3 py-1 font-semibold text-white bg-red-500 rounded-full">
                        SALE
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-6">
                  <h3 className="mb-2 text-xl font-semibold">{book.title}</h3>
                  <p className="mb-4 text-gray-600">by {book.author}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <span className="text-xl font-bold">
                        $
                        {book.sale_price
                          ? book.sale_price.toFixed(2)
                          : book.price.toFixed(2)}
                      </span>
                      {book.sale_price && (
                        <span className="text-sm text-gray-400 line-through">
                          ${book.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(book)}
                      className="px-4 py-2 text-white bg-indigo-600 rounded transition-colors hover:bg-indigo-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              No books found.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LatestCollection;
