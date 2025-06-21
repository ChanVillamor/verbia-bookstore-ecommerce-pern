import React, { useEffect, useState } from "react";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { getImageSrc } from "../utils/helpers";

const SaleBooks = () => {
  const { fetchSaleProducts, saleProducts, loading, error } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const getSaleBooks = async () => {
      try {
        await fetchSaleProducts();
      } catch (err) {
        console.error("Failed to fetch sale books:", err);
      }
    };
    getSaleBooks();
  }, [fetchSaleProducts]);

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
      <section className="py-16 bg-red-50">
        <div className="container mx-auto px-4 text-center">
          <p>Loading special offers...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-red-50">
        <div className="container mx-auto px-4 text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-red-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Special Offers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {saleProducts.length > 0 ? (
            saleProducts.slice(0, 4).map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link to={`/products/${book.id}`}>
                  <div className="relative">
                    <img
                      src={getImageSrc(book.image)}
                      alt={book.title}
                      className="w-full h-64 object-cover"
                    />
                    {book.discount_percentage && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                        {book.discount_percentage}% OFF
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{book.title}</h3>
                  <p className="text-gray-600 mb-4">by {book.author}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xl font-bold text-red-600">
                      $
                      {book.sale_price
                        ? book.sale_price.toFixed(2)
                        : book.price.toFixed(2)}
                    </span>
                    {book.sale_price && (
                      <span className="text-gray-400 line-through">
                        ${book.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(book)}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">
              No special offers available.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default SaleBooks;
