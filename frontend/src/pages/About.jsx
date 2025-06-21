import React from "react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="py-8 min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-3xl sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-center text-gray-900 md:text-4xl md:text-left">
          About
          <span className="pl-3 text-4xl italic font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 drop-shadow-sm select-none">
             Verbia
          </span>
        </h1>

        <div className="overflow-hidden bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 md:text-2xl">
                Our Story
              </h2>
              <p className="text-base text-gray-600 md:text-lg">
                Welcome to our online bookstore, where we've been passionate
                about connecting readers with their next favorite book since
                2024. We believe that books have the power to transform lives,
                spark imagination, and bring people together.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Our Mission
              </h2>
              <p className="text-gray-600">
                Our mission is to make quality books accessible to everyone. We
                carefully curate our collection to include both popular
                bestsellers and hidden gems across various genres. Whether
                you're looking for the latest releases or timeless classics,
                we've got you covered.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                What We Offer
              </h2>
              <ul className="space-y-2 list-disc list-inside text-gray-600">
                <li>Wide selection of books across all genres</li>
                <li>Competitive prices and regular discounts</li>
                <li>Fast and reliable shipping</li>
                <li>Secure payment options</li>
                <li>Excellent customer service</li>
                <li>Easy returns and exchanges</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Our Values
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900">Quality</h3>
                  <p className="text-sm text-gray-600">
                    We ensure that every book we offer meets our high standards
                    of quality.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900">
                    Accessibility
                  </h3>
                  <p className="text-sm text-gray-600">
                    Making books accessible to everyone through competitive
                    pricing and worldwide shipping.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900">
                    Customer Satisfaction
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your satisfaction is our priority. We're here to help you
                    find your next great read.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900">Community</h3>
                  <p className="text-sm text-gray-600">
                    Building a community of readers through reviews,
                    recommendations, and engagement.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Get in Touch
              </h2>
              <p className="mb-4 text-gray-600">
                Have questions or suggestions? We'd love to hear from you! Visit
                our{" "}
                <Link
                  to="/contact"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  contact page
                </Link>{" "}
                to reach out to our team.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
