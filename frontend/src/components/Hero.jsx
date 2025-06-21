import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import { getImageSrc } from "../utils/helpers";

const Hero = () => {
  const { featuredProducts, fetchFeaturedProducts, loading } = useProducts();

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return (
    <div className="relative py-20 text-white bg-gradient-to-r from-red-500 via-indigo-500 via-blue-500 via-green-400 via-yellow-300 via-orange-400 to-pink-500">
      <div className="container grid grid-cols-1 gap-12 items-center px-4 mx-auto md:grid-cols-2">
        {/* LEFT: TEXT CONTENT */}
        <div className="md:order-1">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Discover Your Next Favorite Book
          </h1>
          <p className="mb-8 text-lg md:text-xl">
            Explore our vast collection of books across all genres. From
            bestsellers to hidden gems, find your perfect read today.
          </p>
          <Link
            to="/books"
            className="px-8 py-3 font-semibold text-indigo-700 bg-white rounded-lg transition-colors hover:bg-gray-100"
          >
            Browse Collection
          </Link>
        </div>

        {/* RIGHT: FEATURED BOOKS IN TRIANGLE */}
        {featuredProducts.length > 2 && (
          <div className="flex relative justify-center items-center w-full h-72 md:h-96 md:order-2">
            {/* Top Center */}
            <Link
              to={`/products/${featuredProducts[0].id}`}
              className="absolute top-0 left-1/2 z-20 w-28 h-40 transition-transform duration-300 transform -translate-x-1/2 md:w-36 md:h-56 hover:scale-110"
            >
              <img
                src={getImageSrc(featuredProducts[0].image)}
                alt="Book Cover"
                className="object-cover w-full h-full rounded-lg"
              />
            </Link>

            {/* Bottom Left */}
            <Link
              to={`/products/${featuredProducts[1].id}`}
              className="absolute bottom-10 left-1/4 z-10 w-28 h-40 transition-transform duration-300 transform -translate-x-1/2 md:w-36 md:h-56 hover:scale-110"
            >
              <img
                src={getImageSrc(featuredProducts[1].image)}
                alt="Book Cover"
                className="object-cover w-full h-full rounded-lg"
              />
            </Link>

            {/* Bottom Right */}
            <Link
              to={`/products/${featuredProducts[2].id}`}
              className="absolute bottom-10 right-1/4 z-10 w-28 h-40 transition-transform duration-300 transform translate-x-1/2 md:w-36 md:h-56 hover:scale-110"
            >
              <img
                src={getImageSrc(featuredProducts[2].image)}
                alt="Book Cover"
                className="object-cover w-full h-full rounded-lg"
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;
